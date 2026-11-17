import { NextRequest, NextResponse } from "next/server";
import { requireSpin } from "@/lib/auth";
import { listSpinCustomers } from "@/lib/spin/customers";

// Customer database: heads and the owner.
export async function GET(request: NextRequest) {
  const auth = await requireSpin("manager");
  if ("denied" in auth) return auth.denied;
  const p = request.nextUrl.searchParams;
  try {
    const customers = await listSpinCustomers({
      q: p.get("q") ?? "",
      consent: p.get("consent") === "1",
      verifiedOnly: p.get("all") !== "1",
    });
    return NextResponse.json({ customers });
  } catch (err) {
    console.error("Could not load spin customers", err);
    return NextResponse.json({ error: "Could not load." }, { status: 500 });
  }
}
