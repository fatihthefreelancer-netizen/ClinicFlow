import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("========== SUPABASE CLIENT INITIALIZATION ==========");
console.log("Supabase client initializing");
console.log("Supabase URL:", supabaseUrl);
console.log("Supabase anon key present:", !!supabaseAnonKey);
console.log("Supabase anon key length:", supabaseAnonKey?.length);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("SUPABASE INIT ERROR: Missing Supabase environment variables");
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log("Supabase client created successfully");

let currentAccessToken: string | null = null;

supabase.auth.getSession().then(({ data: { session } }) => {
  console.log("========== INITIAL SESSION CHECK ==========");
  console.log("SESSION OBJECT:", session);
  console.log("SESSION EXISTS:", !!session);
  console.log("AUTH USER:", session?.user);
  console.log("AUTH USER ID:", session?.user?.id);
  console.log("AUTH USER EMAIL:", session?.user?.email);
  console.log("ACCESS TOKEN PRESENT:", !!session?.access_token);
  console.log("ACCESS TOKEN (first 20 chars):", session?.access_token?.substring(0, 20));
  console.log("REFRESH TOKEN PRESENT:", !!session?.refresh_token);
  console.log("SESSION EXPIRES AT:", session?.expires_at);
  currentAccessToken = session?.access_token ?? null;
});

supabase.auth.onAuthStateChange((_event, session) => {
  console.log("========== AUTH STATE CHANGE ==========");
  console.log("AUTH EVENT:", _event);
  console.log("SESSION OBJECT:", session);
  console.log("SESSION EXISTS:", !!session);
  console.log("AUTH USER:", session?.user);
  console.log("AUTH USER ID:", session?.user?.id);
  console.log("AUTH USER EMAIL:", session?.user?.email);
  console.log("ACCESS TOKEN PRESENT:", !!session?.access_token);
  console.log("ACCESS TOKEN (first 20 chars):", session?.access_token?.substring(0, 20));
  console.log("REFRESH TOKEN PRESENT:", !!session?.refresh_token);
  console.log("SESSION IS NULL:", session === null);
  currentAccessToken = session?.access_token ?? null;
});

export function getAccessToken(): string | null {
  console.log("getAccessToken() called, token present:", !!currentAccessToken);
  return currentAccessToken;
}
