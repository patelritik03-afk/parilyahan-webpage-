export const RESERVATION_STATUSES = ["confirmed", "completed", "no_show", "cancelled"] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  confirmed: "Confirmed",
  completed: "Completed",
  no_show: "No-show",
  cancelled: "Cancelled",
};

export function statusLabel(status: string) {
  return STATUS_LABELS[status as ReservationStatus] ?? status;
}
