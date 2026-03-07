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
    console.log("========== useAuth: INITIAL SESSION FETCH ==========");
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("useAuth getSession() result:");
      console.log("  SESSION EXISTS:", !!session);
      console.log("  AUTH USER:", session?.user);
      console.log("  AUTH USER ID:", session?.user?.id);
      console.log("  AUTH USER EMAIL:", session?.user?.email);
      console.log("  ACCESS TOKEN PRESENT:", !!session?.access_token);
      const mapped = mapUser(session?.user ?? null);
      console.log("  MAPPED USER:", mapped);
      setUser(mapped);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("========== useAuth: AUTH STATE CHANGED ==========");
      console.log("  EVENT:", _event);
      console.log("  SESSION EXISTS:", !!session);
      console.log("  AUTH USER ID:", session?.user?.id);
      console.log("  AUTH USER EMAIL:", session?.user?.email);
      const mapped = mapUser(session?.user ?? null);
      console.log("  MAPPED USER:", mapped);
      setUser(mapped);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    console.log("========== LOGIN ATTEMPT ==========");
    console.log("LOGIN EMAIL:", credentials.email);
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      console.log("LOGIN RESULT:");
      console.log("  LOGIN DATA:", data);
      console.log("  LOGIN ERROR:", error);
      console.log("  LOGIN SESSION:", data?.session);
      console.log("  LOGIN USER:", data?.user);
      console.log("  LOGIN USER ID:", data?.user?.id);
      console.log("  LOGIN ACCESS TOKEN PRESENT:", !!data?.session?.access_token);

      if (error) {
        console.error("LOGIN FAILED:", error.message);
        let message = "Email ou mot de passe incorrect";
        if (error.message.includes("Email not confirmed")) {
          message = "Veuillez vérifier votre email avant de vous connecter";
        }
        setLoginError(message);
        return;
      }

      console.log("LOGIN SUCCESS - User ID:", data.user?.id);
      setUser(mapUser(data.user));
      queryClient.invalidateQueries();
    } catch (err: any) {
      console.error("LOGIN EXCEPTION:", err);
      setLoginError(err.message || "Erreur de connexion");
    } finally {
      setIsLoggingIn(false);
    }
  }, [queryClient]);

  const signup = useCallback(async (data: { email: string; password: string; firstName?: string; lastName?: string }) => {
    console.log("========== SIGNUP ATTEMPT ==========");
    console.log("SIGNUP EMAIL:", data.email);
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

      console.log("SIGNUP RESULT:");
      console.log("  SIGNUP ERROR:", error);

      if (error) {
        console.error("SIGNUP FAILED:", error.message);
        if (error.message.includes("already registered")) {
          throw new Error("Un compte avec cet email existe déjà");
        }
        throw new Error(error.message);
      }

      console.log("SIGNUP SUCCESS");
      return { message: "Compte créé. Vérifiez votre email pour activer votre compte." };
    } catch (err: any) {
      console.error("SIGNUP EXCEPTION:", err);
      setSignupError(err.message);
      throw err;
    } finally {
      setIsSigningUp(false);
    }
  }, []);

  const logout = useCallback(async () => {
    console.log("========== LOGOUT ==========");
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      console.log("LOGOUT SUCCESS");
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
