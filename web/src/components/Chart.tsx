
import { SensorReading } from '@/services/api'
import {
  Brush,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const Chart = ({
  data,
  dataKey,
  defaultStartIndex,
  defaultEndIndex,
}: {
  data: SensorReading[]
  dataKey: string
  defaultStartIndex: number
  defaultEndIndex: number
}) => {
  const dataWithConvertedTimestamps = data.map((reading) => {
    return { ...reading, timestamp: new Date(reading.timestamp * 1000) }
  })
  return (
    <ResponsiveContainer width="100%" height={500}>
      <LineChart
        data={dataWithConvertedTimestamps}
        margin={{ top: 5, right: 20, left: 10, bottom: 120 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="timestamp"
          angle={-45}
          textAnchor="end"
          interval="preserveStart"
        />
        <YAxis />
        <Tooltip />
        {/* Place the range selector brush below the rotated time labels. */}
        <Brush
          dataKey="timestamp"
          height={40}
          y={460}
          startIndex={defaultStartIndex}
          endIndex={defaultEndIndex}
        />
        <Line type="monotone" dataKey={dataKey} stroke="#8884d8" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default Chart
