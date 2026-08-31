const TZ = "America/Indiana/Indianapolis";

export function formatSlot(date: Date): string {
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: TZ,
  });
}
