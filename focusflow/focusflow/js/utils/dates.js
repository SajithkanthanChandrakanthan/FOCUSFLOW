/**
 * Date helpers.
 * Days are identified by local-time "YYYY-MM-DD" keys. Everything here works
 * in the local time zone and never goes through UTC (toISOString), so a
 * habit ticked at 11pm still lands on the right day.
 */
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pad2(n) {
  return String(n).padStart(2, '0');
}

function toKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Key -> Date at local midnight. */
function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function todayKey() {
  return toKey(new Date());
}

function addDays(key, n) {
  const d = fromKey(key);
  // setDate keeps local midnight across DST changes; adding 24h of
  // milliseconds would not.
  d.setDate(d.getDate() + n);
  return toKey(d);
}

/** Monday of the week containing `key`. */
function startOfWeek(key) {
  const d = fromKey(key);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return toKey(d);
}

/** ISO keys sort like dates, so plain string comparison is enough. */
function isFuture(key) {
  return key > todayKey();
}

/** Whole days from key `a` to key `b` (positive when b is later). */
function daysBetween(a, b) {
  const da = fromKey(a);
  const db = fromKey(b);
  // Compare as UTC midnights so a DST shift can't make a day 23 or 25 hours long.
  const ms = Date.UTC(db.getFullYear(), db.getMonth(), db.getDate())
    - Date.UTC(da.getFullYear(), da.getMonth(), da.getDate());
  return Math.round(ms / 86400000);
}

function weekdayShort(key) { return WEEKDAYS_SHORT[fromKey(key).getDay()]; }
function weekdayLong(key) { return WEEKDAYS_LONG[fromKey(key).getDay()]; }
function dayOfMonth(key) { return fromKey(key).getDate(); }

/** "Tue, 23 Sep 2025" */
function formatPill(key) {
  const d = fromKey(key);
  return `${WEEKDAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

/** "Mon 22" */
function formatShort(key) {
  return `${weekdayShort(key)} ${dayOfMonth(key)}`;
}

/** "Tue 23 Sep" */
function formatMedium(key) {
  return `${formatShort(key)} ${MONTHS_SHORT[fromKey(key).getMonth()]}`;
}

/** "14:00" -> "2:00 PM" */
function formatTime12(time) {
  const [h, m] = String(time).split(':').map(Number);
  if (Number.isNaN(h)) return '';
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${pad2(m || 0)} ${suffix}`;
}
