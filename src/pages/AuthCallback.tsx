import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Loader2, CheckCircle } from "lucide-react";
import { useState } from "react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      // Supabase автоматически обрабатывает токен из URL hash
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        setStatus("error");
        setErrorMsg(error.message);
        return;
      }

      if (session) {
        setStatus("success");
        // Небольшая задержка чтобы показать успешное подтверждение
        setTimeout(() => navigate("/today", { replace: true }), 1500);
      } else {
        // Пробуем обработать hash из URL (для email confirmation)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error: setError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (setError) {
            setStatus("error");
            setErrorMsg(setError.message);
          } else {
            setStatus("success");
            setTimeout(() => navigate("/today", { replace: true }), 1500);
          }
        } else {
          // Нет токенов — возможно неверная ссылка
          setStatus("error");
          setErrorMsg("Ссылка подтверждения недействительна");
        }
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="app-container bg-background flex flex-col items-center justify-center min-h-screen px-6">
      {status === "loading" && (
        <>
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <h1 className="text-heading text-xl font-bold text-foreground">Подтверждаем...</h1>
          <p className="text-muted-foreground text-sm mt-2">Проверяем вашу учётную запись</p>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle className="w-12 h-12 text-whatsapp mb-4" />
          <h1 className="text-heading text-xl font-bold text-foreground">Email подтверждён!</h1>
          <p className="text-muted-foreground text-sm mt-2">Перенаправляем в приложение...</p>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <span className="text-destructive text-2xl font-bold">!</span>
          </div>
          <h1 className="text-heading text-xl font-bold text-foreground">Ошибка</h1>
          <p className="text-muted-foreground text-sm mt-2 text-center">{errorMsg}</p>
          <button
            onClick={() => navigate("/auth", { replace: true })}
            className="mt-6 btn-gradient h-10 px-6 rounded-xl text-sm font-medium"
          >
            Вернуться к входу
          </button>
        </>
      )}
    </div>
  );
}
