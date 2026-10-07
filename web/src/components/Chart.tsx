import { ListCollection, Portal, Select } from '@chakra-ui/react'
import { useState } from 'react'
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
import { SensorData, SensorReading } from '../services/api'

const Chart = ({
  data,
  dataKey,
  sensorOptions,
  defaultStartIndex,
  defaultEndIndex,
}: {
  data: SensorData[]
  dataKey: string
  sensorOptions: ListCollection<{ label: string; value: number }>
  defaultStartIndex: number
  defaultEndIndex: number
}) => {
  const [displayedReadings, setDisplayedReadings] = useState<SensorReading[]>(
    []
  )

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

  return (
    <div>
      <Select.Root
        multiple={true}
        collection={sensorOptions}
        onValueChange={(e) => {
          const displayedReadings = data
            .filter((data) =>
              e.items.map((item) => item.value).includes(data.sensor.id)
            )
            .flatMap((data) => data.results)
          console.log(displayedReadings)
          setDisplayedReadings(displayedReadings)
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
      <ResponsiveContainer width="100%" height={500}>
        <LineChart
          data={displayedReadings}
          margin={{ top: 5, right: 20, left: 10, bottom: 120 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            angle={-45}
            textAnchor="end"
            interval="preserveStart"
            tickFormatter={(value: number, index) => {
              const date = new Date(value * 1000)
              return `${
                months[date.getUTCMonth()]
              } ${date.getUTCDay()}, ${date.getUTCHours()}:${date.getUTCMinutes()}`
            }}
          />
          <YAxis />
          <Tooltip />
          {/* Place the range selector brush below the rotated time labels. */}
          <Brush dataKey="timestamp" height={40} y={460} />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke="#8884d8"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default Chart
