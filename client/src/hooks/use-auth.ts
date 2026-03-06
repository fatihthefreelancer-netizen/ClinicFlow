import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";

interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

function mapUser(user: SupabaseUser | null): AuthUser | null {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email || "",
    firstName: user.user_metadata?.firstName || user.user_metadata?.first_name || null,
    lastName: user.user_metadata?.lastName || user.user_metadata?.last_name || null,
  };
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(mapUser(session?.user ?? null));
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapUser(session?.user ?? null));
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        let message = "Email ou mot de passe incorrect";
        if (error.message.includes("Email not confirmed")) {
          message = "Veuillez vérifier votre email avant de vous connecter";
        }
        setLoginError(message);
        return;
      }

      setUser(mapUser(data.user));
      queryClient.invalidateQueries();
    } catch (err: any) {
      setLoginError(err.message || "Erreur de connexion");
    } finally {
      setIsLoggingIn(false);
    }
  }, [queryClient]);

  const signup = useCallback(async (data: { email: string; password: string; firstName?: string; lastName?: string }) => {
    setSignupError(null);
    setIsSigningUp(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            first_name: data.firstName || "",
            last_name: data.lastName || "",
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          throw new Error("Un compte avec cet email existe déjà");
        }
        throw new Error(error.message);
      }

      return { message: "Compte créé. Vérifiez votre email pour activer votre compte." };
    } catch (err: any) {
      setSignupError(err.message);
      throw err;
    } finally {
      setIsSigningUp(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      queryClient.clear();
    } finally {
      setIsLoggingOut(false);
    }
  }, [queryClient]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    isLoggingIn,
    loginError,
    signup,
    isSigningUp,
    signupError,
    logout,
    isLoggingOut,
  };
}
