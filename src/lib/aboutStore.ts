import "server-only";
import { supabaseAdmin } from "./supabase";
import { ABOUT_SETTING_KEY, cleanAboutText, type AboutOverride } from "./aboutContent";

// The About Us text edited in the dashboard lives in admin_settings. Anything missing
// (or an unreachable table) falls back to the built-in wording, so the page never breaks.
export async function getAboutOverride(): Promise<AboutOverride> {
  const { data, error } = await supabaseAdmin
    .from("admin_settings")
    .select("value")
    .eq("key", ABOUT_SETTING_KEY)
    .maybeSingle();
  if (error || !data?.value) return {};

  try {
    const parsed = JSON.parse(data.value) as Record<string, unknown>;
    const en = cleanAboutText(parsed.en);
    const tl = cleanAboutText(parsed.tl);
    return { ...(en && { en }), ...(tl && { tl }) };
  } catch {
    return {};
  }
}

export async function saveAboutOverride(content: AboutOverride): Promise<boolean> {
  const { error } = await supabaseAdmin.from("admin_settings").upsert({
    key: ABOUT_SETTING_KEY,
    value: JSON.stringify(content),
    updated_at: new Date().toISOString(),
  });
  if (error) console.error("Could not save the About Us text", error);
  return !error;
}

export async function resetAboutOverride(): Promise<boolean> {
  const { error } = await supabaseAdmin.from("admin_settings").delete().eq("key", ABOUT_SETTING_KEY);
  if (error) console.error("Could not reset the About Us text", error);
  return !error;
}
