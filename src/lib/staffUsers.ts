import "server-only";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "./supabase";
import { toAreas, type Area } from "./adminAreas";

export type StaffUser = { username: string; displayName: string; areas: Area[]; passwordHash: string };

// Compared against when the username does not exist, so a wrong username and a wrong
// password take the same time and give the same answer.
const DUMMY_HASH = bcrypt.hashSync("no-such-staff-user", 10);

export async function findActiveStaff(username: string): Promise<StaffUser | null> {
  const { data, error } = await supabaseAdmin
    .from("staff_users")
    .select("username, display_name, areas, password_hash")
    .eq("username", username)
    .eq("active", true)
    .maybeSingle();
  if (error || !data) return null;
  return {
    username: data.username,
    displayName: data.display_name,
    areas: toAreas(data.areas),
    passwordHash: data.password_hash,
  };
}

export async function checkStaffLogin(username: string, password: string): Promise<StaffUser | null> {
  const user = await findActiveStaff(username);
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  return user && valid ? user : null;
}
