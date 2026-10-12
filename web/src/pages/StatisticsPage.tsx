import {
  createListCollection,
  Heading,
  ListCollection,
  Portal,
  Select,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useEffect, useMemo, useState } from 'react'
import Chart from '../components/Chart'
import { LoadingScreen } from '../components/LoadingScreen'
import api, { DownsampledSensorReading, SensorData } from '../services/api'

const INTERVAL = 14 * 24 * 60 * 60 // 2 weeks

const formatTemperature = (value: number) => `${value}°C`
const formatHumidity = (value: number) => `${value}%`
const formatPressure = (value: number) => `${value} Pa`
const formatParticles = (value: number) => `${value} μg/m³`
const formatCO2 = (value: number) => `${value} ppm`

const StatisticsPage = () => {
  const [sensorData, setSensorData] = useState<SensorData[]>([])
  const [loadError, setLoadError] = useState<string>()

  const [sensorSelectorValue, setSensorSelectorValue] = useState<string[]>([])
  const [loadedSensors, setLoadedSensors] = useState<string[]>([])

  const [sensorOptions, setSensorOptions] =
    useState<ListCollection<{ label: string; value: string }>>()

  const selectedSensorIds = useMemo(
    () => sensorSelectorValue.map(Number),
    [sensorSelectorValue]
  )

  useEffect(() => {
    api.getAllSensors().then((data) => {
      const sensorItems = {
        items: data.map((sensor) => ({
          label: `${sensor.name ?? 'Unnamed sensor'} (Sensor ID: ${sensor.id})`,
          value: String(sensor.id),
        })),
      }

      setSensorOptions(createListCollection(sensorItems))

      setSensorSelectorValue(
        sensorItems.items.some((item) => item.value === '1')
          ? ['1']
          : []
      )
    })
  }, [])

  useEffect(() => {
    const getSensorData = async () => {
      const sensorsToLoad = sensorSelectorValue.filter(
        (id) => !loadedSensors.includes(id)
      )

      if (sensorsToLoad.length === 0) return

      for (const selectedSensorId of sensorsToLoad) {
        try {
          const now = Math.floor(Date.now() / 1000)

          const data = await api.query(Number(selectedSensorId), {
            downsample: true,
            sampling_method: 'mean',
            sample_interval: 3600,
            start: now - INTERVAL,
          })

          data.results = api.toSensorReadings(
            data.results as DownsampledSensorReading[],
            'mean'
          )

          setLoadedSensors((current) => [
            ...current,
            selectedSensorId,
          ])

          setSensorData((current) => [
            ...current,
            data as SensorData,
          ])
        } catch (err) {
          console.error(err)

          if (err instanceof Error) {
            setLoadError(err.toString())
          }
        }
      }
    }

    getSensorData()
  }, [sensorSelectorValue, loadedSensors])

  const hasSensorReadings = sensorData.some(
    (data) => data.results.length > 0
  )

  if (!hasSensorReadings) return null

  return (
    <div>
      <Heading size="xl">Last 2 weeks</Heading>
      <Text mb={4}>Explore historical sensor data.</Text>

      <Select.Root
        multiple
        collection={sensorOptions}
        value={sensorSelectorValue}
        onValueChange={(details) => {
          const ids = details.items
            .map((item) => item.value)
            .sort((a, b) => Number(a) - Number(b))

          setSensorSelectorValue(ids)
        }}
      >
        <Select.Label>Select sensors to display</Select.Label>

        <Select.Control>
          <Select.Trigger>
            <Select.ValueText placeholder="Select sensors" />
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

      {
        sensorData?.length > 0 ? <Stack gap={3} mt={4}>
          <Chart
            title="Temperature"
            originalData={sensorData}
            dataKey="temperature"
            selectedSensorIds={selectedSensorIds}
            yAxisTickFormatter={formatTemperature}
          />

          <Chart
            title="Humidity"
            originalData={sensorData}
            dataKey="humidity"
            selectedSensorIds={selectedSensorIds}
            yAxisTickFormatter={formatHumidity}
          />

          <Chart
            title="Pressure"
            originalData={sensorData}
            dataKey="pressure"
            selectedSensorIds={selectedSensorIds}
            yAxisTickFormatter={formatPressure}
          />

          <Chart
            title="PM1"
            originalData={sensorData}
            dataKey="pm10"
            selectedSensorIds={selectedSensorIds}
            yAxisTickFormatter={formatParticles}
          />

          <Chart
            title="PM2.5"
            originalData={sensorData}
            dataKey="pm25"
            selectedSensorIds={selectedSensorIds}
            yAxisTickFormatter={formatParticles}
          />

          <Chart
            title="PM10"
            originalData={sensorData}
            dataKey="pm100"
            selectedSensorIds={selectedSensorIds}
            yAxisTickFormatter={formatParticles}
          />

          <Chart
            title="CO2"
            originalData={sensorData}
            dataKey="co2"
            selectedSensorIds={selectedSensorIds}
            yAxisTickFormatter={formatCO2}
          />

          <Chart
            title="Volatile organic compounds index (VOC)"
            originalData={sensorData}
            dataKey="voc"
            selectedSensorIds={selectedSensorIds}
          />

          <Chart
            title="Nitrogen oxides index (NOx)"
            originalData={sensorData}
            dataKey="nox"
            selectedSensorIds={selectedSensorIds}
          />
        </Stack> : <LoadingScreen error={loadError} />
      }
    </div>
  )
}

export default StatisticsPage