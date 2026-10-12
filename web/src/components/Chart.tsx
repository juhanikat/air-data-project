import {
  Brush,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  NameType,
  ValueType,
} from 'recharts/types/component/DefaultTooltipContent'
import { SensorData, SensorReading } from '../services/api'

const Chart = ({
  title,
  originalData,
  dataKey,
  selectedSensorIds,
  yAxisTickFormatter,
}: {
  title?: string
  originalData: SensorData[]
  dataKey: keyof SensorReading
  selectedSensorIds?: number[]
  yAxisTickFormatter?: (value: number) => string
}) => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const colors = [
    '#8884d8',
    '#a5e137',
    '#dd9d1c',
    '#ab2636',
    '#39ccac',
    '#241ad6',
  ]

  const findXAxisDomain = () => {
    let minimum = data[0].results[0]
    let maximum = data[0].results[0]
    for (const sensorData of data) {
      for (const result of sensorData.results) {
        if (result.timestamp < minimum.timestamp) {
          minimum = result
        }
        if (result.timestamp > maximum.timestamp) {
          maximum = result
        }
      }
    }
    console.log([minimum.timestamp, maximum.timestamp])
    return [minimum.timestamp, maximum.timestamp]
  }

  let data = originalData
  if (selectedSensorIds) {
    data = data.filter((d) => selectedSensorIds.includes(d.sensor.id))
  }

  const allSensorIds = data.map((sensorData) => sensorData.sensor.id)

  const readingsWithIds = data
    .flatMap((sensorData) =>
      sensorData.results.map((reading) => ({
        ...reading,
        sensorKey: `sensor-${sensorData.sensor.id}`,
      }))
    )
    .toSorted((a, b) => a.timestamp - b.timestamp)

  // AI generated code to make chart timestamps work, can probably be removed once backend gives all sensors identical timestamps
  const chartData = readingsWithIds.reduce<
    Array<Record<string, number | null | undefined>>
  >((points, reading) => {
    const existingPoint = points.at(-1)

    if (existingPoint?.timestamp === reading.timestamp) {
      existingPoint[reading.sensorKey] = reading[dataKey] as
        | number
        | null
        | undefined
    } else {
      points.push({
        timestamp: reading.timestamp,
        [reading.sensorKey]: reading[dataKey] as number | null | undefined,
      })
    }

    return points
  }, [])

  return (
    <div style={{ width: '100%', height: 500 }}>
      <h2>{title ?? ''}</h2>
      <ResponsiveContainer>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 10, bottom: 120 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            domain={[0, 1]}
            angle={-45}
            textAnchor="end"
            interval="preserveStart"
            tickFormatter={(value: number) => {
              const date = new Date(value * 1000)
              return `${
                months[date.getUTCMonth()]
              } ${date.getUTCDay()}, ${date.getUTCHours()}:${date.getUTCMinutes()}`
            }}
          />
          <YAxis domain={[0, 'auto']} tickFormatter={yAxisTickFormatter} />
          <ReferenceLine
            x={data[0].results[100].timestamp}
            stroke="red"
            strokeDasharray={'3 3'}
            label="testing referenceline"
          />

          <Tooltip
            labelFormatter={() => ''}
            formatter={(value: ValueType | undefined) => {
              if (typeof value !== 'number') return value
              else if (!yAxisTickFormatter) return value.toFixed(2)
              return yAxisTickFormatter(+value.toFixed(2)) // weird javascript trick to convert string back to number
            }}
          />
          <Brush dataKey="timestamp" height={40} y={460} />
          {allSensorIds.map((sensorId, index) => (
            <Line
              key={sensorId}
              type="monotone"
              dataKey={`sensor-${sensorId}`}
              stroke={colors[index]}
              dot={false}
              activeDot={true}
              connectNulls={true}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default Chart
