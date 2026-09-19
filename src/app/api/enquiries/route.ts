import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { sendOwnerEnquiryEmail } from "@/lib/email";
import { sendOwnerEnquiryWhatsApp } from "@/lib/whatsapp";
import { logFailures } from "@/lib/notify";
import type { EnquiryPayload } from "@/lib/enquiry";

const common = {
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().regex(/^\+\d{1,4} \d{5,14}$/),
  email: z.string().trim().email().max(200),
  message: z.string().trim().max(2000).optional().default(""),
};

const enquirySchema = z.discriminatedUnion("type", [
  z.object({
    ...common,
    type: z.literal("Event"),
    eventType: z.string().trim().min(1).max(120),
    pax: z.number().int().min(1).max(5000),
    eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  z.object({ ...common, type: z.literal("Marketing collab") }),
  z.object({ ...common, type: z.literal("Partnership") }),
  z.object({ ...common, type: z.literal("Other"), specify: z.string().trim().min(1).max(300) }),
]);

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = enquirySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
  }

  const enquiry = parsed.data as EnquiryPayload;

  const [saved, email, whatsapp] = await Promise.allSettled([
    supabaseAdmin
      .from("enquiries")
      .insert({
        name: enquiry.name,
        phone: enquiry.phone,
        email: enquiry.email,
        type: enquiry.type,
        specify: enquiry.specify ?? null,
        event_type: enquiry.eventType ?? null,
        pax: enquiry.pax ?? null,
        event_date: enquiry.eventDate ?? null,
        message: enquiry.message || null,
      })
      .then(({ error }) => {
        if (error) throw new Error(`Supabase: ${error.message}`);
        return true;
      }),
    sendOwnerEnquiryEmail(enquiry),
    sendOwnerEnquiryWhatsApp(enquiry),
  ]);
  logFailures("Enquiry", [saved, email, whatsapp]);

  // The enquiry must be stored or emailed to the owner; WhatsApp alone is only a nudge.
  const recorded =
    (saved.status === "fulfilled" && saved.value) || (email.status === "fulfilled" && email.value);
  if (!recorded) {
    return NextResponse.json({ error: "Could not send your enquiry." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
