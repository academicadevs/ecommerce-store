/**
 * Normalize a date string so JavaScript always interprets it as UTC.
 *
 * SQLite's CURRENT_TIMESTAMP stores UTC values without a trailing 'Z'
 * (e.g. "2026-02-11 22:27:00").  When new Date() parses such a string
 * it treats it as *local* time, silently breaking any subsequent
 * timeZone conversion.  This helper appends 'Z' when the suffix is
 * missing so the Date constructor treats the value as UTC.
 */
function normalizeUTC(dateStr) {
  if (!dateStr) return dateStr;
  if (typeof dateStr !== 'string') return dateStr;
  // Already has timezone info — leave it alone
  if (dateStr.endsWith('Z') || dateStr.includes('+') || /\d{2}:\d{2}$/.test(dateStr) === false && dateStr.includes('T')) {
    // Has 'Z', has '+' offset, or is already ISO — return as-is if it ends with Z or has offset
    if (dateStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateStr)) return dateStr;
  }
  return dateStr.replace(' ', 'T') + 'Z';
}

/**
 * Format a date string to Pacific Time (America/Los_Angeles).
 *
 * @param {string} dateStr  — raw date string from the database
 * @param {Intl.DateTimeFormatOptions} [opts] — extra options merged on top of defaults
 * @returns {string} formatted date in PT
 */
export function formatDatePT(dateStr, opts = {}) {
  const defaults = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Los_Angeles',
  };
  return new Date(normalizeUTC(dateStr)).toLocaleDateString('en-US', { ...defaults, ...opts });
}

/**
 * Short date format — "Feb 12" style (no year, no time).
 */
export function formatDateShortPT(dateStr, opts = {}) {
  return formatDatePT(dateStr, { year: undefined, hour: undefined, minute: undefined, ...opts });
}

/**
 * Date-only format — "2/11/2026" style.
 */
export function formatDateOnlyPT(dateStr) {
  return new Date(normalizeUTC(dateStr)).toLocaleDateString('en-US', {
    timeZone: 'America/Los_Angeles',
  });
}
