import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client for server-side use only (API routes, Server Components).
// Never import this file from a "use client" component - the service role key
// must never reach the browser.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
