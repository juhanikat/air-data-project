import { Box, Flex, Heading } from '@chakra-ui/react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { SensorData, SensorReading } from '../services/api'

const Chart = ({
  title,
  originalData,
  dataKey,
  selectedSensorIds,
  forecastStartIndex,
  yAxisTickFormatter,
}: {
  title?: string
  originalData: SensorData[]
  dataKey: keyof SensorReading
  selectedSensorIds?: number[]
  forecastStartIndex?: number
  yAxisTickFormatter?: (value: number) => string
}) => {
  const colors = [
    '#8884d8',
    '#a5e137',
    '#dd9d1c',
    '#ab2636',
    '#39ccac',
    '#241ad6',
  ]

  let data = originalData

  if (selectedSensorIds) {
    data = data.filter((d) => selectedSensorIds.includes(d.sensor.id))
  }

  const allSensorIds = data.map((sensorData) => sensorData.sensor.id)

  const forecastStartTimestamp =
    forecastStartIndex !== undefined
      ? data[0]?.results[forecastStartIndex]?.timestamp
      : undefined

  const readingsWithIds = data
    .flatMap((sensorData) =>
      sensorData.results.map((reading) => ({
        ...reading,
        sensorKey: `sensor-${sensorData.sensor.id}`,
      }))
    )
    .toSorted((a, b) => a.timestamp - b.timestamp)

  const chartData = readingsWithIds.reduce<
    Array<Record<string, number | null | undefined>>
  >((points, reading) => {
    let existingPoint = points.at(-1)

    if (existingPoint?.timestamp !== reading.timestamp) {
      existingPoint = {
        timestamp: reading.timestamp,
      }

      points.push(existingPoint)
    }

    const value = reading[dataKey] as number | null | undefined

    if (
      forecastStartTimestamp !== undefined &&
      reading.timestamp >= forecastStartTimestamp
    ) {
      existingPoint[`${reading.sensorKey}-forecast`] = value
    }

    if (
      forecastStartTimestamp === undefined ||
      reading.timestamp <= forecastStartTimestamp
    ) {
      existingPoint[reading.sensorKey] = value
    }

    return points
  }, [])

  const formatTimestamp = (value: number) => {
    const d = new Date(value * 1000)

    return `${d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'numeric',
    })} @ ${d.toLocaleTimeString('fi-FI', {
      hour: '2-digit',
      minute: '2-digit',
    })}`
  }

  // Find the minimum/maximum forecast value and its timestamp for each UTC day.
  const getDailyForecastExtremes = (mode: 'min' | 'max') => {
    if (forecastStartTimestamp === undefined) {
      return []
    }

    const days = new Map<
      number,
      {
        timestamp: number
        value: number
      }
    >()

    for (const reading of readingsWithIds) {
      if (reading.timestamp < forecastStartTimestamp) {
        continue
      }

      const value = reading[dataKey] as number | null | undefined

      if (typeof value !== 'number') {
        continue
      }

      const date = new Date(reading.timestamp * 1000)

      const day =
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) /
        1000

      const existing = days.get(day)

      if (
        !existing ||
        (mode === 'max' && value > existing.value) ||
        (mode === 'min' && value < existing.value)
      ) {
        days.set(day, {
          timestamp: reading.timestamp,
          value,
        })
      }
    }

    return [...days.values()]
  }

  const dailyForecastMaximums = getDailyForecastExtremes('max')
  const dailyForecastMinimums = getDailyForecastExtremes('min')

  return (
    <Box
      border="1px solid"
      borderColor="blackAlpha.300"
      borderRadius="12px"
      height="600px"
      width="auto"
      p={4}
    >
      <Flex width="100%" justifyContent="center">
        <Heading size="lg" mb={2}>
          {title ?? ''}
        </Heading>
      </Flex>

      <ResponsiveContainer>
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 20,
            left: 10,
            bottom: 100,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="timestamp"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickCount={20}
            minTickGap={5}
            angle={-45}
            height={90}
            tick={{
              fill: 'black',
              fontSize: 11,
            }}
            textAnchor="end"
            tickFormatter={formatTimestamp}
          />

          <YAxis
            domain={['auto', 'auto']}
            tickFormatter={yAxisTickFormatter}
            tick={{ fill: 'black' }}
          />

          {/* Daily forecast maximums */}
          {dailyForecastMaximums.map(({ timestamp }) => (
            <ReferenceLine
              key={`max-${timestamp}`}
              x={timestamp}
              stroke="red"
              strokeWidth={16}
              strokeOpacity={0.2}
              zIndex={100}
              label={{
                value: formatTimestamp(timestamp),
                position: 'insideTop',
                angle: -20,
                fill: 'red',
                fontSize: 11,
              }}
            />
          ))}

          {/* Daily forecast minimums */}
          {dailyForecastMinimums.map(({ timestamp }) => (
            <ReferenceLine
              key={`min-${timestamp}`}
              x={timestamp}
              stroke="green"
              strokeWidth={16}
              strokeOpacity={0.2}
              zIndex={100}
              label={{
                value: formatTimestamp(timestamp),
                position: 'insideBottom',
                angle: -20,
                fill: 'green',
                fontSize: 11,
              }}
            />
          ))}
          {/* commented out until empty objects in sensor-6 data are changed to null
          <Tooltip
            labelFormatter={(value) =>
              typeof value === 'number' ? formatTimestamp(value) : value
            }
            formatter={(value: ValueType | undefined) => {
              if (typeof value !== 'number') {
                return value
              }

              if (!yAxisTickFormatter) {
                return value.toFixed(2)
              }

              return yAxisTickFormatter(+value.toFixed(2))
            }}
          /> */}

          {/* Measurements */}
          {allSensorIds.map((sensorId, index) => (
            <Line
              key={`sensor-${sensorId}`}
              strokeWidth={2}
              type="monotone"
              dataKey={`sensor-${sensorId}`}
              stroke={colors[index % colors.length]}
              dot={false}
              activeDot
              connectNulls
              animationDuration={1000}
              zIndex={400}
            />
          ))}

          {/* Forecast */}
          {forecastStartTimestamp !== undefined &&
            allSensorIds.map((sensorId) => (
              <Line
                key={`sensor-${sensorId}-forecast`}
                strokeWidth={2}
                type="monotone"
                dataKey={`sensor-${sensorId}-forecast`}
                stroke="blue"
                strokeDasharray="5 5"
                dot={false}
                activeDot
                connectNulls
                animationBegin={1000}
                animationDuration={1000}
                zIndex={400}
              />
            ))}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  )
}

export default Chart
