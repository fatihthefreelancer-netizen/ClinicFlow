import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

let currentAccessToken: string | null = null;

supabase.auth.getSession().then(({ data: { session } }) => {
  currentAccessToken = session?.access_token ?? null;
});

supabase.auth.onAuthStateChange((_event, session) => {
  currentAccessToken = session?.access_token ?? null;
});

export function getAccessToken(): string | null {
  return currentAccessToken;
}
