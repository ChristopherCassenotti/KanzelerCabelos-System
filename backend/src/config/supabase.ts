import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env["SUPABASE_URL"];
const supabaseSecretKey = process.env["SUPABASE_SECRET_KEY"];

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL não configurada");
}

if (!supabaseSecretKey) {
  throw new Error("SUPABASE_SECRET_KEY não configurada");
}

// Uma instância por operação de autenticação: mesmo sem persistSession,
// signInWithPassword/refreshSession mantêm a sessão em memória.
export function createSupabaseAuthClient() {
  return createClient(supabaseUrl!, supabaseSecretKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

// Cliente exclusivo do backend. Não aceita sessões de usuários; o SDK
// aplica a Secret API Key aos headers sem substituí-la por um JWT de login.
export const supabase = createClient(
  supabaseUrl,
  supabaseSecretKey,
  {
    accessToken: async () => null,
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);
