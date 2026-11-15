const millisecondsPerDay = 86_400_000;
const formatters = new Map<string, Intl.DateTimeFormat>();

export function dateInRestaurant(value: Date, timeZone = 'UTC') {
  let format = formatters.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    formatters.set(timeZone, format);
  }
  const parts = Object.fromEntries(
    format.formatToParts(value).map(({ type, value }) => [type, value]),
  );
  return new Date(`${parts.year}-${parts.month}-${parts.day}T00:00:00Z`);
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * millisecondsPerDay);
}

export function inclusiveDays(start: Date, end: Date) {
  return Math.max(
    0,
    (end.getTime() - start.getTime()) / millisecondsPerDay + 1,
  );
}

export function restaurantDayStart(date: Date, timeZone: string) {
  let low = date.getTime() - millisecondsPerDay;
  let high = date.getTime() + millisecondsPerDay;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (dateInRestaurant(new Date(middle), timeZone) < date) low = middle + 1;
    else high = middle;
  }
  return new Date(low);
}
