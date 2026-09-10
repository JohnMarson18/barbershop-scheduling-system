"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UserProfile, UserRole } from "@/types/api";

const STORAGE_KEY = "barbearia_auth_session";

export interface AuthContextType {
  profile: UserProfile | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isBarber: boolean;
  isClient: boolean;
  loading: boolean;
  getAuthHeaders: () => Record<string, string>;
  login: (emailOrPassword: string, passwordOnly?: string) => Promise<boolean>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    barber_id?: string | null;
    lgpd_consent: true;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "barbearia_auth_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Carrega a sessão inicial do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (stored) {
        const parsed: UserProfile = JSON.parse(stored);
        setProfile(parsed);
        setToken(storedToken || (parsed ? `demo-token:${parsed.role}:${parsed.id}` : null));
      }
    } catch (err) {
      console.warn("Erro ao restaurar sessão:", err);
    } finally {
      setLoading(false);
    }

    // Sincroniza estado se houver alteração em outra aba ou storage
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        if (e.newValue) {
          try {
            const newProfile = JSON.parse(e.newValue);
            setProfile(newProfile);
            setToken(localStorage.getItem(TOKEN_KEY) || `demo-token:${newProfile.role}:${newProfile.id}`);
          } catch {
            setProfile(null);
            setToken(null);
          }
        } else {
          setProfile(null);
          setToken(null);
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const currentToken = token || (profile ? `demo-token:${profile.role}:${profile.id}` : null);
    if (!currentToken) return {};
    return {
      Authorization: `Bearer ${currentToken}`,
    };
  }, [token, profile]);

  const login = useCallback(
    async (emailOrPassword: string, passwordOnly?: string): Promise<boolean> => {
      try {
        let payload: { email?: string; password: string };

        if (passwordOnly !== undefined) {
          payload = { email: emailOrPassword, password: passwordOnly };
        } else {
          payload = { password: emailOrPassword };
        }

        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (result.success && result.data?.profile) {
          const userProfile: UserProfile = result.data.profile;
          const authToken = result.data.token || `demo-token:${userProfile.role}:${userProfile.id}`;

          // Atualiza estado global imediatamente
          setProfile(userProfile);
          setToken(authToken);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
          localStorage.setItem(TOKEN_KEY, authToken);
          localStorage.setItem(
            "admin_authenticated",
            userProfile.role === "client" ? "false" : "true"
          );
          return true;
        }
        return false;
      } catch (err) {
        console.error("[AUTH ERROR]:", err);
        return false;
      }
    },
    []
  );

  const register = useCallback(
    async (input: {
      name: string;
      email: string;
      password: string;
      role?: UserRole;
      barber_id?: string | null;
      lgpd_consent: true;
    }): Promise<{ success: boolean; error?: string }> => {
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        const currentToken = token || (profile ? `demo-token:${profile.role}:${profile.id}` : null);
        if (currentToken) {
          headers["Authorization"] = `Bearer ${currentToken}`;
        }

        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers,
          body: JSON.stringify(input),
        });

        const result = await response.json();
        if (result.success && result.data?.profile) {
          if (!profile || profile.role === "client") {
            const userProfile: UserProfile = result.data.profile;
            const authToken = result.data.token || `demo-token:${userProfile.role}:${userProfile.id}`;
            setProfile(userProfile);
            setToken(authToken);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
            localStorage.setItem(TOKEN_KEY, authToken);
            localStorage.setItem(
              "admin_authenticated",
              userProfile.role === "client" ? "false" : "true"
            );
          }
          return { success: true };
        }
        return { success: false, error: result.error || "Erro ao realizar cadastro." };
      } catch (err) {
        return { success: false, error: "Erro de conexão ao cadastrar." };
      }
    },
    [profile, token]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("admin_authenticated");
    setProfile(null);
    setToken(null);
  }, []);

  const isAuthenticated = !!profile;
  const role = profile?.role || null;
  const isAdmin = role === "admin";
  const isBarber = role === "barber";
  const isClient = role === "client";

  return (
    <AuthContext.Provider
      value={{
        profile,
        role,
        token,
        isAuthenticated,
        isAdmin,
        isBarber,
        isClient,
        loading,
        getAuthHeaders,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
