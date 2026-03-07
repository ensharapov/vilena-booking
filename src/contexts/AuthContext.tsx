import React, { createContext, useContext, useState, ReactNode } from "react";

type UserRole = "master" | "client" | null;

interface AuthState {
  isAuthenticated: boolean;
  email: string | null;
  role: UserRole;
  login: (email: string) => void;
  logout: () => void;
  setRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>(null);

  const login = (email: string) => {
    setEmail(email);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setEmail(null);
    setIsAuthenticated(false);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, email, role, login, logout, setRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
