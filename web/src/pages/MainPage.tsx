import { HStack } from '@chakra-ui/react'
import { SensorValueCard } from '../components/SensorValueCard'
import Chart from '../components/Chart'
import { SensorData } from '@/services/api'

const MainPage = ({
  data,
  defaultStartIndex,
  defaultEndIndex,
}: {
  data: SensorData
  defaultStartIndex: number
  defaultEndIndex: number
}) => {
  const sensorReadings = data.results
  if (sensorReadings.length === 0) return

  const lastIndex = sensorReadings.length - 1
  const lastDataPoint = new Date(
    sensorReadings[sensorReadings.length - 1].timestamp * 1000
  )

  return (
    <div>
      
      <HStack gap="4px" align="start">
        <SensorValueCard
          type={'temperature'}
          label={'Test Temperature Card'}
          value={sensorReadings[lastIndex].temperature ?? 0}
          timestamp={lastDataPoint}
        />
        <SensorValueCard
          type={'percentage'}
          label={'Test Humidity Card'}
          value={sensorReadings[lastIndex].humidity ?? 0}
          timestamp={lastDataPoint}
        />
      </HStack>

      <h2>Temperature</h2>
      <div>
        <Chart
          data={sensorReadings}
          dataKey={'temperature'}
          defaultStartIndex={defaultStartIndex}
          defaultEndIndex={defaultEndIndex}
        />
      </div>
      <h2>Humidity</h2>
      <div>
        <Chart
          data={sensorReadings}
          dataKey={'humidity'}
          defaultStartIndex={defaultStartIndex}
          defaultEndIndex={defaultEndIndex}
        />
      </div>
    </div>
  )
}

export default MainPage
