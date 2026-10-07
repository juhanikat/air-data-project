import { createListCollection, HStack, ListCollection } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import Chart from '../components/Chart'
import { LoadingScreen } from '../components/LoadingScreen'
import { SensorValueCard } from '../components/SensorValueCard'
import api, { DownsampledSensorReading, SensorData } from '../services/api'

const MainPage = () => {
  const [sensorData, setSensorData] = useState<SensorData[]>([])
  const [loadError, setLoadError] = useState<string | undefined>()
  const [sensorOptions, setSensorOptions] =
    useState<ListCollection<{ label: string; value: number }>>()

  useEffect(() => {
    api.getAllSensors().then((data) => {
      setSensorOptions(
        createListCollection({
          items: data.map((sensor) => ({
            label: `${sensor.name ?? 'Unnamed sensor'} (Sensor ID: ${sensor.id})`,
            value: sensor.id,
          })),
        })
      )
    })
  }, [])

  useEffect(() => {
    const joku = async () => {
      if (!sensorOptions) return
      const allData: SensorData[] = []
      for (const sensorOption of sensorOptions) {
        try {
          const data = await api.query(sensorOption.value, {
            downsample: true,
            sampling_method: 'mean',
            sample_interval: 360, // one sample every 10 seconds, 360 * 10 = 1 hour
            start: 0, // All data!
          })

          // Format data to be just the values without "mean" key
          data.results = api.toSensorReadings(
            data.results as DownsampledSensorReading[],
            'mean'
          )
        } catch (err) {
          console.error(err)
          if (err instanceof Error) setLoadError(err.toString())
        }
      }
      setSensorData(allData)
    }
    joku()
  }, [sensorOptions])

  if (!sensorData || !sensorOptions) {
    return <LoadingScreen error={loadError} />
  }

  const sensorReadings = sensorData.flatMap((data) => data.results)
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

  // Set the end and start indices for the brush component. User will see the last week by default.gs
  const defaultEndIndex =
    sensorReadings.length > 1 ? sensorReadings.length - 1 : 0
  const defaultStartIndex =
    sensorReadings.length > 1
      ? Math.max(0, sensorReadings.length - pointsPerWeek)
      : 0

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

      <h2>Temperature</h2>

      <div>
        <Chart
          data={sensorData}
          dataKey={'temperature'}
          sensorOptions={sensorOptions}
          defaultStartIndex={defaultStartIndex}
          defaultEndIndex={defaultEndIndex}
        />
      </div>
      <h2>Humidity</h2>
      <div>
        <Chart
          data={sensorData}
          dataKey={'humidity'}
          sensorOptions={sensorOptions}
          defaultStartIndex={defaultStartIndex}
          defaultEndIndex={defaultEndIndex}
        />
      </div>
    </div>
  )
}

export default MainPage
