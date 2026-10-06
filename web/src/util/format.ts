/**
 * Formats a Unix timestamp (seconds from 1970-01-01 00:00:00 UTC) as a local date-time string.
 *
 * @param {number} timestamp - Unix timestamp in seconds.
 * @returns {string} Formatted as "YYYY-MM-DD HH-MM-SS" in local time.
 */
export const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp * 1000)
  const pad = (value: number) => String(value).padStart(2, '0')
  // Use local time
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`
}
