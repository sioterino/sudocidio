"use client";

import { createContext, useContext, useRef, useState, useEffect, type ReactNode } from "react";

declare global {
  interface Window {
    google?: typeof google;
  }
}

const GOOGLE_CLIENT_ID =
  "331191695151-ku8mdhd76pc2k36itas8lm722krn0u64.apps.googleusercontent.com";

interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  login: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      script.onload = initGoogle;
    } else if (window.google) {
      initGoogle();
    }
  }, []);

  function initGoogle() {
    if (initialized.current) return;
    initialized.current = true;

    window.google?.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (res: any) => {
        if (!res.error) {
          setToken(res.credential);
        }
      },
    });
  }

  function login() {
    window.google?.accounts.id.prompt();
  }

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, login }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}