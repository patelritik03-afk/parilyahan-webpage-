const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// "2026-10-11" -> { short: "Oct 11, 2026", weekday: "Sunday" } without depending on server locale or timezone.
export function posterDateLabel(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const weekday = DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return { short: `${MONTHS[m - 1]} ${d}, ${y}`, weekday };
}
