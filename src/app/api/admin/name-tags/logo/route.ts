import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { requireAdmin } from "@/lib/auth";

// The hotel logo used on the name tags. It is served only to the logged-in admin, not published on the public site.
export async function GET() {
  const denied = await requireAdmin("name-tags");
  if (denied) return denied;

  const logo = await readFile(join(process.cwd(), "src/assets/nametag/ibis-styles.jpeg"));
  return new Response(new Uint8Array(logo), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=86400" },
  });
}
