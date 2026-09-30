import { useEffect, useState } from 'react'
import api, { DownsampledSensorReading, SensorData } from './services/api'
import SettingsPage from './pages/SettingsPage'
import MainPage from './pages/MainPage'
import { Tabs } from '@chakra-ui/react'

/**
 * Formats a Unix timestamp (seconds from 1970-01-01 00:00:00 UTC) as a local date-time string.
 *
 * @param {number} timestamp - Unix timestamp in seconds.
 * @returns {string} Formatted as "YYYY-MM-DD HH-MM-SS" in local time.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp * 1000)
  const pad = (value: number) => String(value).padStart(2, '0')
  // Use local time
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`
  // Use UTC time
  //return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}-${pad(date.getUTCMinutes())}-${pad(date.getUTCSeconds())}`
}

const App = () => {
  const [sensorData, setSensorData] = useState<SensorData>()

  // Test fetching data directly from icetea.esinko.net
  // Not in use.
  useEffect(() => {
    api
      .query(2, {
        downsample: true,
        sample_method: "mean",
        sample_interval: 360, // one sample every 10 seconds, 360 * 10 = 1 hour
        start: 0 // All data!
      })
      .then((data) => {
        // Format data to be just the values without "mean" key
        data.results = api.toSensorReadings(data.results as DownsampledSensorReading[], "mean")

        setSensorData(data)
      })
  }, [])
  console.log('data from internet:', sensorData)

  if (!sensorData) {
    return <div>Fetching sensor data...</div>
  }
  const sensorReadings = sensorData.results

  // Calculate how many data points there are in a week
  const pointsPerWeek =
    sensorReadings.length > 1
      ? Math.ceil(
          (7 * 24 * 60 * 60) /
            Math.abs(sensorReadings[0].timestamp - sensorReadings[1].timestamp)
        )
      : 1

  // Set the end and start indices for the brush component. User will see the last week by default.gs
  const defaultEndIndex =
    sensorReadings.length > 1 ? sensorReadings.length - 1 : 0
  const defaultStartIndex =
    sensorReadings.length > 1
      ? Math.max(0, sensorReadings.length - pointsPerWeek)
      : 0

  return (
    <div>
      <h1>Ebin Air Data Roject</h1>
      <Tabs.Root defaultValue="mainPage">
        <Tabs.List>
          <Tabs.Trigger value="mainPage">Main</Tabs.Trigger>
          <Tabs.Trigger value="settingsPage">Settings</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="mainPage">
          <MainPage
            data={sensorData}
            defaultStartIndex={defaultStartIndex}
            defaultEndIndex={defaultEndIndex}
          />
        </Tabs.Content>
        <Tabs.Content value="settingsPage">
          <SettingsPage />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}

export default App
