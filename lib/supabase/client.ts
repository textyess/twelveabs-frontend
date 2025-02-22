import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createSupabaseClient(supabaseToken?: string) {
  // Check environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error("NEXT_PUBLIC_SUPABASE_URL is not defined");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined");
  }

  const client = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: supabaseToken
          ? {
              Authorization: `Bearer ${supabaseToken}`,
            }
          : {},
      },
    }
  );

  // Debug: Log the current session
  client.auth.getSession().then((session) => {
    console.log("Debug - Current session:", session);
    console.log("Debug - Access token:", session.data.session?.access_token);
  });

  return client;
}
