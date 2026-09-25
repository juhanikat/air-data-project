import { HStack } from '@chakra-ui/react'
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
import { SensorValueCard } from '../components/SensorValueCard'

const MainPage = ({ data, defaultStartIndex, defaultEndIndex }) => {
  return (
    <div>
      <HStack gap="4px" align="start">
        <SensorValueCard
          type={'temperature'}
          label={'Test Temperature Card'}
          value={30.2}
          timestamp={new Date('2026-09-22')}
        />
        <SensorValueCard
          type={'percentage'}
          label={'Test Humidity Card'}
          value={55.5}
          timestamp={new Date('2026-09-20')}
        />
      </HStack>

      <ResponsiveContainer width="100%" height={500}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, left: 10, bottom: 120 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            angle={-45}
            textAnchor="end"
            interval="preserveStart"
          />
          <YAxis />
          <Tooltip />
          {/* Place the range selector brush below the rotated time labels. */}
          <Brush
            dataKey="time"
            height={40}
            y={460}
            startIndex={defaultStartIndex}
            endIndex={defaultEndIndex}
          />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke="#8884d8"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <h2>Data</h2>
      {data.map((item) => (
        <div key={item.id}>
          {item.time} | Temp: {item.temperature.toFixed(2)} | Humidity:{' '}
          {item.humidity}
        </div>
      ))}
    </div>
  )
}

export default MainPage
