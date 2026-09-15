import { useState, useEffect } from 'react'
import dataService from './services/air-data'

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp * 1000)
  const pad = (value) => String(value).padStart(2, '0')

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}-${pad(date.getUTCMinutes())}-${pad(date.getUTCSeconds())}`
}

const App = () => {
  const [data, setData] = useState([])

  useEffect(() => {
    dataService.getData().then((data) => setData(data))
  }, [])

  console.log(data)

  return (
    <div>
      <h1>Ebin Air Data Broject</h1>
      {data.map((item) => (
        <div key={item.id}>
          Time: {formatTimestamp(item.timestamp)} | Temperature:{' '}
          {item.temperature}
        </div>
      ))}
    </div>
  )
}

export default App
