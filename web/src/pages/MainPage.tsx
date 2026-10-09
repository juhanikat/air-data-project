import { HStack } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { LoadingScreen } from '../components/LoadingScreen'
import { SensorValueCard } from '../components/SensorValueCard'
import api, { LatestSensorData } from '../services/api'

const MainPage = () => {
  const [sensorData, setSensorData] = useState<LatestSensorData[]>([])
  const [loadError, setLoadError] = useState<string | undefined>()

  useEffect(() => {
    api
      .getLatest()
      .then((data) => {
        console.log(data)
        setSensorData(data)
      })
      .catch((err) => {
        console.log(err)
        if (err instanceof Error) setLoadError(err.toString())
      })
  }, [])

  if (sensorData.length === 0) {
    return <LoadingScreen error={loadError} />
  }

  const sensorReadings = sensorData.flatMap((data) => {
    const { sensor, ...readingData } = data
    return readingData
  })
  if (sensorReadings.length === 0) return

  const lastIndex = sensorReadings.length - 1
  const lastDataPoint = new Date(
    sensorReadings[sensorReadings.length - 1].timestamp * 1000
  )

  // Calculate how many data points there are in a week
  const pointsPerWeek =
    sensorReadings.length > 1
      ? Math.ceil(
          (7 * 24 * 60 * 60) /
            Math.abs(sensorReadings[0].timestamp - sensorReadings[1].timestamp)
        )
      : 1

  return (
    <div>
      <HStack gap="4px" align="start">
        <SensorValueCard
          type={'temperature'}
          label={'Test Temperature Card'}
          value={sensorReadings[lastIndex].temperature ?? 0}
          timestamp={lastDataPoint}
        />
        <SensorValueCard
          type={'percentage'}
          label={'Test Humidity Card'}
          value={sensorReadings[lastIndex].humidity ?? 0}
          timestamp={lastDataPoint}
        />
      </HStack>
    </div>
  )
}

export default MainPage
