import { HStack, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { LoadingScreen } from '../components/LoadingScreen'
import { SensorValueCard } from '../components/SensorValueCard'
import api, { LatestSensorData } from '../services/api'

export type Time = {
  value: number
  unit: 'second' | 'minute' | 'hour' | 'day'
}
const timestampToTime = (timestamp: number): Time => {
  const currentTime = Date.now()

  const msSinceReading = currentTime - timestamp * 1000
  const secondsSinceReading = msSinceReading / 1000
  const minutesSinceReading = secondsSinceReading / 60
  const hoursSinceReading = minutesSinceReading / 60

  if (secondsSinceReading < 60) {
    return { value: Math.round(secondsSinceReading), unit: 'second' }
  } else if (minutesSinceReading < 60) {
    return { value: Math.round(minutesSinceReading), unit: 'minute' }
  } else if (hoursSinceReading < 24) {
    return { value: Math.round(hoursSinceReading), unit: 'hour' }
  } else {
    return { value: Math.round(hoursSinceReading / 24), unit: 'day' }
  }
}
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { sensor, ...readingData } = data
    return readingData
  })
  if (sensorReadings.length === 0) return

  const lastIndex = sensorReadings.length - 1
  const lastDataPoint = new Date(
    sensorReadings[sensorReadings.length - 1].timestamp * 1000
  )
  return (
    <div>
      <Text mb={4}>Latest sensor data from all sensors.</Text>
      {sensorData.map((data) => {
        const lastUpdatedTime = timestampToTime(data.timestamp)
        const lastUpdatedString = `${lastUpdatedTime.value} ${lastUpdatedTime.unit}${lastUpdatedTime.value === 1 ? '' : 's'} ago`
        return (
          <div key={data.sensor.id}>
            <h1>{`${data.sensor.name} (ID: ${data.sensor.id})`}</h1>
            <h2>Last updated: {lastUpdatedString}</h2>
            <HStack gap="4px" align="start">
              {data.temperature && (
                <SensorValueCard
                  label={'Temperature'}
                  dataKey={'temperature'}
                  value={data.temperature}
                  timestamp={new Date(data.timestamp * 1000)}
                />
              )}
              {data.humidity && (
                <SensorValueCard
                  label={'Humidity'}
                  dataKey={'humidity'}
                  value={data.humidity}
                  timestamp={new Date(data.timestamp * 1000)}
                />
              )}
              {data.pressure && (
                <SensorValueCard
                  label={'Pressure'}
                  dataKey={'pressure'}
                  value={data.pressure}
                  timestamp={new Date(data.timestamp * 1000)}
                />
              )}
              {data.pm10 && (
                <SensorValueCard
                  label={'PM1'}
                  dataKey={'pm10'}
                  value={data.pm10}
                  timestamp={new Date(data.timestamp * 1000)}
                />
              )}
              {data.pm25 && (
                <SensorValueCard
                  label={'PM2.5'}
                  dataKey={'pm25'}
                  value={data.pm25}
                  timestamp={new Date(data.timestamp * 1000)}
                />
              )}
              {data.pm100 && (
                <SensorValueCard
                  label={'PM10'}
                  dataKey={'pm100'}
                  value={data.pm100}
                  timestamp={new Date(data.timestamp * 1000)}
                />
              )}
              {data.co2 && (
                <SensorValueCard
                  label={'CO2'}
                  dataKey={'co2'}
                  value={data.co2}
                  timestamp={new Date(data.timestamp * 1000)}
                />
              )}
              {data.voc && (
                <SensorValueCard
                  label={'Volatile organic compounds index (VOC)'}
                  dataKey={'voc'}
                  value={data.voc}
                  timestamp={new Date(data.timestamp * 1000)}
                />
              )}
              {data.nox && (
                <SensorValueCard
                  label={'Nitrogen oxides index (NOx)'}
                  dataKey={'nox'}
                  value={data.nox}
                  timestamp={new Date(data.timestamp * 1000)}
                />
              )}
            </HStack>
          </div>
        )
      })}
    </div>
  )
}

export default MainPage
