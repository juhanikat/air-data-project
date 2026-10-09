function getBaseURL() {
  // @ts-expect-error We can safely check
  if (import.meta.env?.DEV) return 'http://localhost:9001'
  return 'http://icetea.esinko.net:9001'
}

export interface Sensor {
  id: number
  name: string
  mac: string
  location: string
}

export interface SensorReading {
  timestamp: number
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

export interface LatestSensorData extends SensorReading {
  sensor: Sensor
}

async function getLatest(): Promise<LatestSensorData[]> {
  const res = await fetch(`${getBaseURL()}/api/v1/latest`)
  return res.json()
}

type QueryIntervalOptions =
  | { start: number; end?: number }
  | { start?: number; end: number }

type QueryDownSamplingMethod = 'mean' | 'average' | 'min' | 'max'

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

interface DownSampledFloat {
  // NOTE: Too lazy to do conditionals
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

export interface QueryResponse {
  sensor: Sensor
  results: DownsampledSensorReading[] | SensorReading[]
  downsample: boolean | undefined
}

export interface QueryResponse {
  sensor: Sensor
  results: DownsampledSensorReading[] | SensorReading[]
  downsample: boolean | undefined
}

export type SensorsResponse = Sensor[]

export interface SensorData {
  sensor: Sensor
  results: SensorReading[]
  downsample: boolean | undefined
}

export interface User {
  id: number
  name: string
}

async function query(
  id: number,
  options: QueryOptions
): Promise<QueryResponse> {
  const res = await fetch(`${getBaseURL()}/api/v1/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, ...options }),
  })
  return await res.json()
}

async function getAllSensors(): Promise<SensorsResponse> {
  const res = await fetch(`${getBaseURL()}/api/v1/sensors`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  return await res.json()
}

function toSensorReadings(
  items: DownsampledSensorReading[],
  method: string
): SensorReading[] {
  return items.map(
    (item) =>
      Object.fromEntries(
        Object.keys(item).map((key) =>
          // @ts-expect-error Too lazy to fix
          [key, item[key][method] ?? item[key]]
        )
      ) as SensorReading
  )
}

async function getMe(): Promise<User | undefined> {
  const res = await fetch(`${getBaseURL()}/api/v1/me`, {
    credentials: 'include',
  })
  if (res.status !== 200) return undefined
  return await res.json()
}

async function login(
  username: string,
  password: string
): Promise<User | undefined> {
  const res = await fetch(`${getBaseURL()}/api/v1/login`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      password,
    }),
  })
  if (res.status !== 200) return undefined
  return await res.json()
}

async function logout() {
  await fetch(`${getBaseURL()}/api/v1/logout`, { credentials: 'include' })
}

export default {
  getLatest,
  getBaseURL,
  query,
  getAllSensors,
  toSensorReadings,
  getMe,
  login,
  logout,
}
