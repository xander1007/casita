/** Today as YYYY-MM-DD in the browser's local time (toISOString() is UTC: tomorrow after 7 p.m. in Peru). */
export function localTodayIso(offsetDays = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/** Formats a YYYY-MM-DD date without shifting it a day back through UTC. */
export function formatDate(value: string | null | undefined): string {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString("es-PE") : "-";
}
