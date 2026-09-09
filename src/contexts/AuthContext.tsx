"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UserProfile, UserRole } from "@/types/api";

const STORAGE_KEY = "barbearia_auth_session";

export interface AuthContextType {
  profile: UserProfile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isBarber: boolean;
  isClient: boolean;
  loading: boolean;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Carrega a sessão inicial do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: UserProfile = JSON.parse(stored);
        setProfile(parsed);
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
            setProfile(JSON.parse(e.newValue));
          } catch {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

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
          // Atualiza estado global imediatamente
          setProfile(userProfile);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
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
        if (profile?.role === "admin") {
          headers["x-admin-id"] = profile.id;
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
            setProfile(userProfile);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
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
    [profile]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("admin_authenticated");
    setProfile(null);
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
        isAuthenticated,
        isAdmin,
        isBarber,
        isClient,
        loading,
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
