import "server-only";
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { supabaseAdmin } from "./supabase";
import { toAreas, toStaffRole, type Area, type StaffRole } from "./adminAreas";

export type StaffUser = {
  username: string;
  displayName: string;
  areas: Area[];
  role: StaffRole;
  passwordHash: string;
};

export type StaffAccount = {
  username: string;
  displayName: string;
  areas: Area[];
  role: StaffRole;
  active: boolean;
  createdAt: string;
};

// Compared against when the username does not exist, so a wrong username and a wrong
// password take the same time and give the same answer.
const DUMMY_HASH = bcrypt.hashSync("no-such-staff-user", 10);

export async function findActiveStaff(username: string): Promise<StaffUser | null> {
  const { data, error } = await supabaseAdmin
    .from("staff_users")
    .select("username, display_name, areas, role, password_hash")
    .eq("username", username)
    .eq("active", true)
    .maybeSingle();
  if (error || !data) return null;
  return {
    username: data.username,
    displayName: data.display_name,
    areas: toAreas(data.areas),
    role: toStaffRole(data.role),
    passwordHash: data.password_hash,
  };
}

export async function changeStaffPassword(username: string, current: string, next: string) {
  const user = await findActiveStaff(username);
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) return "wrong-current" as const;

  const { error } = await supabaseAdmin
    .from("staff_users")
    .update({ password_hash: await bcrypt.hash(next, 10), updated_at: new Date().toISOString() })
    .eq("username", username);
  if (error) {
    console.error("Could not save the staff password", error);
    return "failed" as const;
  }
  return "ok" as const;
}

export async function checkStaffLogin(username: string, password: string): Promise<StaffUser | null> {
  const user = await findActiveStaff(username);
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  return user && valid ? user : null;
}

// --- Owner's Staff accounts screen ---

// No 0/O or 1/l/I, so a password read out loud or from a screenshot is not mistyped.
const PASSWORD_ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generatePassword(length = 14) {
  let out = "";
  for (let i = 0; i < length; i++) out += PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)];
  return out;
}

export async function listStaffAccounts(): Promise<StaffAccount[]> {
  const { data, error } = await supabaseAdmin
    .from("staff_users")
    .select("username, display_name, areas, role, active, created_at")
    .order("active", { ascending: false })
    .order("display_name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    username: row.username,
    displayName: row.display_name,
    areas: toAreas(row.areas),
    role: toStaffRole(row.role),
    active: row.active,
    createdAt: row.created_at,
  }));
}

export async function createStaffAccount(input: {
  username: string;
  displayName: string;
  areas: Area[];
  role: StaffRole;
}) {
  const password = generatePassword();
  const { error } = await supabaseAdmin.from("staff_users").insert({
    username: input.username,
    display_name: input.displayName,
    areas: input.areas,
    role: input.role,
    password_hash: await bcrypt.hash(password, 10),
  });
  if (error) {
    if (error.code === "23505") return { ok: false as const, error: "That username is already taken." };
    console.error("Could not create staff account", error);
    return { ok: false as const, error: "Could not create the account." };
  }
  return { ok: true as const, password };
}

export async function updateStaffAccount(
  username: string,
  patch: { displayName?: string; areas?: Area[]; role?: StaffRole; active?: boolean }
) {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.displayName !== undefined) update.display_name = patch.displayName;
  if (patch.areas !== undefined) update.areas = patch.areas;
  if (patch.role !== undefined) update.role = patch.role;
  if (patch.active !== undefined) update.active = patch.active;
  const { data, error } = await supabaseAdmin
    .from("staff_users")
    .update(update)
    .eq("username", username)
    .select("username")
    .maybeSingle();
  if (error) console.error("Could not update staff account", error);
  return !error && Boolean(data);
}

export async function resetStaffPassword(username: string) {
  const password = generatePassword();
  const { data, error } = await supabaseAdmin
    .from("staff_users")
    .update({ password_hash: await bcrypt.hash(password, 10), updated_at: new Date().toISOString() })
    .eq("username", username)
    .select("username")
    .maybeSingle();
  if (error || !data) {
    if (error) console.error("Could not reset staff password", error);
    return null;
  }
  return password;
}
