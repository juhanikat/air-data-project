import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import dataService from './services/air-data'

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp * 1000)
  const pad = (value) => String(value).padStart(2, '0')

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}-${pad(date.getUTCMinutes())}-${pad(date.getUTCSeconds())}`
}

const App = () => {
  const [data, setData] = useState([])

  useEffect(() => {
    dataService.getData().then((data) =>
      setData(
        data.map((item) => ({
          ...item,
          time: formatTimestamp(item.timestamp),
        })),
      ),
    )
  }, [])

  console.log(data)

  return (
    <div>
      <h1>Ebin Air Data Broject</h1>

      <ResponsiveContainer width="100%" height={500}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, left: 10, bottom: 100 }}
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
          {item.time} | Temperature: {item.temperature}
        </div>
      ))}
    </div>
  )
}

export default App
