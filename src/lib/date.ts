export function todayISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });
}
