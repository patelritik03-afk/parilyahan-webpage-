import type { TranslationKey } from "./i18n/translations";

export const ENQUIRY_TYPES: { value: string; key: TranslationKey }[] = [
  { value: "Event", key: "enquiry.type.event" },
  { value: "Marketing collab", key: "enquiry.type.marketing" },
  { value: "Partnership", key: "enquiry.type.partnership" },
  { value: "Other", key: "enquiry.type.other" },
];

export const EVENT_TYPES: { value: string; key: TranslationKey }[] = [
  { value: "Birthday", key: "enquiry.event.birthday" },
  { value: "Corporate event", key: "enquiry.event.corporate" },
  { value: "Wedding", key: "enquiry.event.wedding" },
  { value: "Anniversary", key: "enquiry.event.anniversary" },
  { value: "Private party", key: "enquiry.event.party" },
  { value: "Other", key: "enquiry.event.other" },
];

export type EnquiryPayload = {
  name: string;
  phone: string;
  email: string;
  type: string;
  specify?: string;
  eventType?: string;
  pax?: number;
  eventDate?: string;
  message?: string;
};
