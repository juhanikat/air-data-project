// generate-mock-data.js
// Generates mock fridge sensor readings (temperature + humidity) at
// 15-minute intervals, in the "wide" format used by the frontend:
//   { id, temperature, humidity, timestamp }
// Output is shaped for json-server: { "airData": [ ... ] }
//
// Data always starts at 00:00 on START_DATE and ends at 23:45 on the
// last day (START_DATE + DAYS - 1).
//
// Usage:
//   node generate-mock-data.js > db.json
//   npx json-server db.json
//   # -> http://localhost:3000/airData
//
// To change the range, edit START_DATE / DAYS below, or pass them on
// the command line:
//   node generate-mock-data.js --start 2025-03-01 --days 14 > db.json

const args = process.argv.slice(2)
function getArg(name, fallback) {
  const idx = args.indexOf(`--${name}`)
  return idx !== -1 && args[idx + 1] !== undefined ? args[idx + 1] : fallback
}

// ---- Config -----------------------------------------------------------
const START_DATE = getArg('start', '2026-08-20') // YYYY-MM-DD, local time, data starts at 00:00 this day
const DAYS = parseInt(getArg('days', '28'), 10) // data ends at 23:45 on the last day
const INTERVAL_MINUTES = 15

// Fridge temperature: cold-storage baseline with a small day/night swing
// (compressor cycling + door openings tend to nudge it up a bit during
// the day) plus random jitter.
const BASE_TEMP = 6.0 // °C
const DAILY_TEMP_SWING = 0.8 // +/- °C over 24h, peak in the afternoon
const TEMP_NOISE = 0.15 // random jitter per reading

// Humidity: fridge interiors sit roughly in the 40-50% RH range; slightly
// higher during the day (more door openings letting in room-temp air).
const BASE_HUMIDITY = 45 // %
const DAILY_HUMIDITY_SWING = 3 // +/- % over 24h
const HUMIDITY_NOISE = 1.5 // random jitter per reading
// ------------------------------------------------------------------------

const INTERVAL_MS = INTERVAL_MINUTES * 60 * 1000
const POINTS_PER_DAY = (24 * 60) / INTERVAL_MINUTES // 96
const TOTAL_POINTS = DAYS * POINTS_PER_DAY

function hourOfDay(pointIndex) {
  return ((pointIndex * INTERVAL_MINUTES) / 60) % 24
}

function generateTemperature(pointIndex) {
  const hour = hourOfDay(pointIndex)
  // Peak in the afternoon (~15:00), trough overnight (~03:00)
  const wave = DAILY_TEMP_SWING * Math.sin(((hour - 9) / 24) * 2 * Math.PI)
  const jitter = (Math.random() - 0.5) * 2 * TEMP_NOISE
  return Math.round((BASE_TEMP + wave + jitter) * 100) / 100
}

function generateHumidity(pointIndex) {
  const hour = hourOfDay(pointIndex)
  const wave = DAILY_HUMIDITY_SWING * Math.sin(((hour - 9) / 24) * 2 * Math.PI)
  const jitter = (Math.random() - 0.5) * 2 * HUMIDITY_NOISE
  return Math.round(BASE_HUMIDITY + wave + jitter)
}

function main() {
  // Parse START_DATE as local midnight.
  const [year, month, day] = START_DATE.split('-').map(Number)
  const startTime = new Date(year, month - 1, day, 0, 0, 0, 0).getTime()

  const airData = []
  for (let i = 0; i < TOTAL_POINTS; i++) {
    const timestampMs = startTime + i * INTERVAL_MS
    airData.push({
      id: i + 1,
      temperature: generateTemperature(i),
      humidity: generateHumidity(i),
      timestamp: Math.floor(timestampMs / 1000), // unix seconds
    })
  }

  const db = { airData }
  process.stdout.write(JSON.stringify(db, null, 2) + '\n')
}

main()
