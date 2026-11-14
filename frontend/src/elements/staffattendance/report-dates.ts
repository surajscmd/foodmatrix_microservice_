const dateFormatters = new Map<string, Intl.DateTimeFormat>();

export function restaurantDate(value: string | Date, timeZone: string) {
  let formatter = dateFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    dateFormatters.set(timeZone, formatter);
  }
  return formatter.format(new Date(value));
}

export function moveMonth(month: string, offset: number) {
  const date = new Date(`${month}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}

export function restaurantDateTime(local: string, timeZone: string) {
  const target = Date.parse(`${local}:00Z`);
  if (!Number.isFinite(target)) return null;

  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const format = (instant: number) => formatter.format(instant).replace(" ", "T");

  // Check the offsets on both sides of a possible daylight-saving transition.
  for (const dayOffset of [-1, 1]) {
    const sample = target + dayOffset * 86_400_000;
    const offset = Date.parse(`${format(sample)}:00Z`) - sample;
    const instant = target - offset;
    if (format(instant) === local) return new Date(instant).toISOString();
  }
  return null;
}

export function monthQuery(month: string) {
  const start = Date.parse(`${month}-01T00:00:00Z`);
  const end = Date.parse(`${moveMonth(month, 1)}-01T00:00:00Z`);

  // Fetch a UTC window that covers the local month, then filter by local dates.
  return {
    startDate: new Date(start - 86_400_000).toISOString(),
    endDate: new Date(end + 86_400_000).toISOString(),
  };
}
