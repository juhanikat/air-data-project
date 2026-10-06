function getBaseURL() {
  // @ts-expect-error We can safely check
  if (import.meta.env?.DEV) return "http://localhost:9001"
  return "http://icetea.esinko.net:9001"
}

export interface Sensor {
  id: number
  name: string
  mac: string
  location: string
}

export interface SensorReading {
  timestamp: number | null
  temperature: number | null
  humidity: number | null
  pressure: number | null
  pm10: number | null
  pm25: number | null
  pm40: number | null
  pm100: number | null
  co2: number | null
  voc: number | null
  nox: number | null
  during_calibration: boolean
}

interface LatestSensorData extends SensorReading {
  sensor: Sensor
}

async function getLatest(): Promise<LatestSensorData[]> {
  const res = await fetch(`${getBaseURL()}/api/v1/latest`)
  return res.json()
}

type QueryIntervalOptions =
  | { start: number; end?: number }
  | { start?: number; end: number }

type QueryDownSamplingMethod = "mean" | "average" | "min" | "max"

type QueryDownSampleOptions =
  | {
    downsample?: false
    sampling_method?: never
    sample_interval?: never
  }
  | {
    downsample: true
    sampling_method: QueryDownSamplingMethod | QueryDownSamplingMethod[]
    sample_interval?: number
  }

type QueryOptions = QueryIntervalOptions & QueryDownSampleOptions

interface DownSampledFloat { // NOTE: Too lazy to do conditionals
  mean?: number
  median?: number
  min?: number
  max?: number
}

export interface DownsampledSensorReading {
  timestamp: number
  temperature: DownSampledFloat
  humidity: DownSampledFloat
  pressure: DownSampledFloat
  pm10: DownSampledFloat
  pm25: DownSampledFloat
  pm100: DownSampledFloat
  co2: DownSampledFloat
  voc: DownSampledFloat
  nox: DownSampledFloat
  during_calibration: boolean
}

export interface SensorData {
  sensor: Sensor
  results: DownsampledSensorReading[] | SensorReading[]
  downsample: boolean | undefined
}

async function query(id: number, options: QueryOptions): Promise<SensorData> {
  const res = await fetch(`${getBaseURL()}/api/v1/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ id, ...options })
  })
  return (await res.json())
}

function toSensorReadings(items: DownsampledSensorReading[], method: string): SensorReading[] {
  return items.map((item) =>
    Object.fromEntries(
      Object.keys(item).map((key) =>
        typeof item[key] == "object" ? item[key][method] : item[key]
      )
    ) as SensorReading
  )
}

export default {
  getLatest,
  getBaseURL,
  query,
  toSensorReadings
}


