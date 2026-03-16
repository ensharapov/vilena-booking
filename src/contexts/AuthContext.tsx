import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase, type DBMaster } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

interface AuthState {
  session: Session | null;
  user: User | null;
  master: DBMaster | null;
  isLoading: boolean;
  isMasterLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [master, setMaster] = useState<DBMaster | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMasterLoading, setIsMasterLoading] = useState(false);

  // БАГ 1 ИСПРАВЛЕН: убран try/finally — setIsMasterLoading(false) только в явных точках выхода
  const fetchMaster = async (userId: string, attempt = 1) => {
    setIsMasterLoading(true);

    const { data, error } = await supabase
      .from("masters")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.warn("[fetchMaster] attempt", attempt, error.code, error.message);
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 600 * attempt));
        return fetchMaster(userId, attempt + 1);
      }
      // После 3 попыток — не обнуляем master, снимаем флаг
      setIsMasterLoading(false);
      return;
    }

    setMaster(data);
    setIsMasterLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    const sessionTimeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000));

    Promise.race([supabase.auth.getSession(), sessionTimeout]).then(async (result) => {
      if (cancelled) return;

      if (result === null) {
        setIsLoading(false);
        return;
      }

      const { data: { session } } = result;
      setSession(session);
      if (session?.user) await fetchMaster(session.user.id);
      if (!cancelled) setIsLoading(false);
    });

    // БАГ 2 ИСПРАВЛЕН: игнорируем INITIAL_SESSION — его обрабатывает getSession() выше
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (_event === "INITIAL_SESSION") return;

        setSession(session);
        if (session?.user) {
          await fetchMaster(session.user.id);
        } else {
          setMaster(null);
          setIsMasterLoading(false);
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setMaster(null);
    setIsMasterLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        master,
        isLoading,
        isMasterLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
