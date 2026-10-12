import {
  createListCollection,
  Flex,
  Heading,
  ListCollection,
  Portal,
  Select,
  Text,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import Chart from '../components/Chart'
import { LoadingScreen } from '../components/LoadingScreen'
import api, { DownsampledSensorReading, SensorData, User } from '../services/api'

const terms = [
  'temperature',
  'humidity',
  'pressure',
  'PM10',
  'PM25',
  'PM40',
  'PM100',
  'CO2',
  'VOC',
  'NOx',
] as const

type Term = (typeof terms)[number]

const termOptions = createListCollection({
  items: terms.map((term) => ({
    label: term,
    value: term,
  })),
})

const StatisticsPage = (props: { user: User }) => {
  const [sensorData, setSensorData] = useState<SensorData>()
  const [forecastStartIndex, setForecastStartIndex] = useState<number>()
  const [loadError, setLoadError] = useState<string>()
  const [loadStatus, setLoadStatus] = useState<string | undefined>()

  const [selectedSensor, setSelectedSensor] = useState<string[]>([])
  const [selectedTerm, setSelectedTerm] = useState<string[]>(['temperature'])

  const [sensorOptions, setSensorOptions] =
    useState<ListCollection<{ label: string; value: string }>>()

  useEffect(() => {
    api.getAllSensors().then((data) => {
      const items = data.map((sensor) => ({
        label: `${sensor.name ?? 'Unnamed sensor'} (Sensor ID: ${sensor.id})`,
        value: String(sensor.id),
      }))

      setSensorOptions(createListCollection({ items }))

      // Select sensor 1 by default, or the first available sensor
      const defaultSensor =
        items.find((item) => item.value === '1') ?? items[0]

      if (defaultSensor) {
        setSelectedSensor([defaultSensor.value])
      }
    })
  }, [])

  useEffect(() => {
    const sensorId = selectedSensor[0]
    const term = selectedTerm[0] as Term | undefined

    if (!sensorId || !term) return

    const getSensorData = async () => {
      try {
        setSensorData(undefined)
        setLoadError(undefined)

        const numericSensorId = Number(sensorId)

        // Find the latest datapoint for the selected sensor
        setLoadStatus("Getting timestamp")
        const latestData = await api.getLatest()

        const latestReading = latestData.find(
          (reading) => reading.sensor.id === numericSensorId
        )

        if (!latestReading) {
          throw new Error(
            `No latest reading found for sensor ${numericSensorId}`
          )
        }

        const latestTimestamp = latestReading.timestamp
        const threeDaysAgo = latestTimestamp - 3 * 24 * 60 * 60

        // Get measurements for the 24 hours preceding the latest datapoint
        setLoadStatus("Getting historical data")
        const historical = await api.query(numericSensorId, {
          downsample: true,
          sampling_method: 'mean',
          sample_interval: 3600, // 1 hour
          start: threeDaysAgo - 1,
          end: latestTimestamp + 1,
        })

        // Get forecast for the next day
        setLoadStatus("Forecasting")
        const forecast = await api.forecastDaysAhead(
          numericSensorId,
          term,
          2
        )
        setLoadStatus(undefined)

        historical.results = api.toSensorReadings(
          historical.results as DownsampledSensorReading[],
          'mean'
        )

        // First forecast datapoint will be at this index
        setForecastStartIndex(historical.results.length)

        setSensorData({
          ...historical,
          results: [
            ...historical.results,
            ...forecast.forecast,
          ],
        } as SensorData)
      } catch (err) {
        console.error(err)

        if (err instanceof Error) {
          setLoadError(err.toString())
        }
      }
    }

    getSensorData()
  }, [selectedSensor, selectedTerm])

  if (!sensorOptions) {
    return <LoadingScreen error={loadError} />
  }

  if (!props.user) {
    return <LoadingScreen error={"You must login to perform forecasts. Otherwise our little CPU would cry :("} />
  }

  const term = selectedTerm[0] as Term

  return (
    <div>
      <Heading>Forecast with SARIMAX</Heading>
      <Text mb={4}>Get a 2-day forecast for a given sensor and data type.</Text>

      <Flex width="100%" gap={4} mb={4}>
        <Select.Root
            collection={sensorOptions}
            value={selectedSensor}
            onValueChange={(details) => setSelectedSensor(details.value)}
        >
            <Select.Label>Sensor</Select.Label>

            <Select.Control>
            <Select.Trigger>
                <Select.ValueText placeholder="Select sensor" />
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

        <Select.Root
            collection={termOptions}
            value={selectedTerm}
            onValueChange={(details) => setSelectedTerm(details.value)}
        >
            <Select.Label>Term</Select.Label>

            <Select.Control>
            <Select.Trigger>
                <Select.ValueText placeholder="Select term" />
            </Select.Trigger>
            </Select.Control>

            <Portal>
            <Select.Positioner>
                <Select.Content>
                {termOptions.items.map((item) => (
                    <Select.Item item={item} key={item.value}>
                    {item.label}
                    <Select.ItemIndicator />
                    </Select.Item>
                ))}
                </Select.Content>
            </Select.Positioner>
            </Portal>
        </Select.Root>
      </Flex>

      {sensorData ? (
        <Chart
          title={term}
          originalData={[sensorData]}
          dataKey={term.toLowerCase()}
          selectedSensorIds={[Number(selectedSensor[0])]}
          forecastStartIndex={forecastStartIndex}
        />
      ) : <LoadingScreen error={loadError} text={loadStatus}/>}
    </div>
  )
}

export default StatisticsPage