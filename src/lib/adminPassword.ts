import "server-only";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "./supabase";

const KEY = "admin_password_hash";

// A password changed from the dashboard is stored in Supabase and wins over the
// ADMIN_PASSWORD_HASH environment variable, which stays as the fallback.
export async function getPasswordHash(): Promise<string | null> {
  const { data, error } = await supabaseAdmin.from("admin_settings").select("value").eq("key", KEY).maybeSingle();
  if (!error && data?.value) return data.value;
  return process.env.ADMIN_PASSWORD_HASH || null;
}

export async function savePassword(password: string): Promise<boolean> {
  const value = await bcrypt.hash(password, 10);
  const { error } = await supabaseAdmin
    .from("admin_settings")
    .upsert({ key: KEY, value, updated_at: new Date().toISOString() });
  if (error) console.error("Could not save the admin password", error);
  return !error;
}
