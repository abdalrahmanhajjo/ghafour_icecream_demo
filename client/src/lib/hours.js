// Shop hours (from the site's structured data): every day 10:30 → 00:30, Beirut time.
export const OPENS_MIN = 10 * 60 + 30; // 10:30
export const CLOSES_MIN = 30; // 00:30 the next day

/** Minutes past midnight in Beirut for the given instant. */
export function beirutMinutes(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Beirut',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type) => Number(parts.find((p) => p.type === type)?.value || 0);
  return get('hour') * 60 + get('minute');
}

/** true while the shop is open (the window crosses midnight). */
export function isOpen(date = new Date()) {
  const m = beirutMinutes(date);
  return m >= OPENS_MIN || m < CLOSES_MIN;
}
