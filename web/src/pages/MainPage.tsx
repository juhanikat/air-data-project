import { HStack } from '@chakra-ui/react'
import { SensorValueCard } from '../components/SensorValueCard'
import Chart from '../components/Chart'

const MainPage = ({ data, defaultStartIndex, defaultEndIndex }) => {
  if (data.length === 0) {
    return
  }
  const lastIndex = data.length - 1
  const lastDataPoint = new Date(data[lastIndex]['timestamp'] * 1000)

  return (
    <div>
      <HStack gap="4px" align="start">
        <SensorValueCard
          type={'temperature'}
          label={'Test Temperature Card'}
          value={data[lastIndex]['temperature']}
          timestamp={lastDataPoint}
        />
        <SensorValueCard
          type={'percentage'}
          label={'Test Humidity Card'}
          value={data[lastIndex]['humidity']}
          timestamp={lastDataPoint}
        />
      </HStack>

      <h2>Temperature</h2>
      <div>
        <Chart
          data={data}
          dataKey={'temperature'}
          defaultStartIndex={defaultStartIndex}
          defaultEndIndex={defaultEndIndex}
        />
      </div>
      <h2>Humidity</h2>
      <div>
        <Chart
          data={data}
          dataKey={'humidity'}
          defaultStartIndex={defaultStartIndex}
          defaultEndIndex={defaultEndIndex}
        />
      </div>

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
