/**
 * Date formatting helpers (PL) – consistent, no hours.
 */

function toDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null
  const d = value instanceof Date ? value : new Date(value as never)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Format as dd.MM.yyyy; returns fallback (default: '—') when value is empty/invalid.
 */
export function formatDate(value: unknown, fallback = '—'): string {
  const d = toDate(value)
  if (!d) return fallback
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}.${mm}.${yyyy}`
}

/**
 * Format as dd.MM (no year); returns fallback (default: '—') when value is empty/invalid.
 */
export function formatDayMonth(value: unknown, fallback = '—'): string {
  const d = toDate(value)
  if (!d) return fallback
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}.${mm}`
}
