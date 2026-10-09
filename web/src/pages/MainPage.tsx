import {
  createListCollection,
  HStack,
  ListCollection,
  Portal,
  Select,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import Chart from '../components/Chart'
import { LoadingScreen } from '../components/LoadingScreen'
import { SensorValueCard } from '../components/SensorValueCard'
import api, { DownsampledSensorReading, SensorData } from '../services/api'

const MainPage = () => {
  const [sensorData, setSensorData] = useState<SensorData[]>([])
  const [loadError, setLoadError] = useState<string | undefined>()

  // Currently displayed sensors
  const [sensorSelectorValue, setSensorSelectorValue] = useState<string[]>([])

  // All sensors that the backend has
  const [sensorOptions, setSensorOptions] =
    useState<ListCollection<{ label: string; value: string }>>()

  useEffect(() => {
    api.getAllSensors().then((data) => {
      const sensorItems = {
        items: data.map((sensor) => ({
          label: `${sensor.name ?? 'Unnamed sensor'} (Sensor ID: ${sensor.id})`,
          value: String(sensor.id),
        })),
      }
      const listCollection = createListCollection(sensorItems)
      setSensorOptions(listCollection)

      // show sensor with ID 1 by default, if it exists
      setSensorSelectorValue(
        sensorItems.items.find((item) => item.value === '1') ? ['1'] : []
      )
    })
  }, [])

  useEffect(() => {
    const getSensorData = async () => {
      if (!sensorOptions) return
      const allData: SensorData[] = []
      for (const sensorOption of sensorOptions) {
        try {
          const data = await api.query(Number(sensorOption.value), {
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
          allData.push(data as SensorData)
        } catch (err) {
          console.error(err)
          if (err instanceof Error) setLoadError(err.toString())
        }
      }
      setSensorData(allData)
    }
    getSensorData()
  }, [sensorOptions])

  if (sensorData.length === 0 || !sensorOptions) {
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

      <Select.Root
        multiple={true}
        collection={sensorOptions}
        value={sensorSelectorValue}
        onValueChange={(details) => {
          setSensorSelectorValue(details.items.map((item) => item.value))
        }}
      >
        <Select.Label>Select sensors to display</Select.Label>
        <Select.Control>
          <Select.Trigger>
            <Select.ValueText placeholder="Select framework" />
          </Select.Trigger>
        </Select.Control>
        <Portal>
          <Select.Positioner>
            <Select.Content>
              {sensorOptions.items.map((sensor) => (
                <Select.Item item={sensor} key={sensor.value}>
                  {sensor.label}
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>

      <div>
        <Chart
          originalData={sensorData}
          dataKey={'temperature'}
          selectedSensorIds={sensorSelectorValue.map((stringId) =>
            Number(stringId)
          )}
        />
      </div>
      <h2>Humidity</h2>
      <div>
        <Chart
          originalData={sensorData}
          dataKey={'humidity'}
          selectedSensorIds={sensorSelectorValue.map((stringId) =>
            Number(stringId)
          )}
        />
      </div>
    </div>
  )
}

export default MainPage
