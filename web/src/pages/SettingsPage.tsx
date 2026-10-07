import { Sensor } from '../services/api'
import { createListCollection, Flex, Listbox } from '@chakra-ui/react'

type SensorListProps = {
  sensors: Sensor[]
}

type LoginInfo = {
  username: string
  password: string
}

const SensorList: React.FC<SensorListProps> = ({ sensors }) => {
  const sensorCollection = createListCollection({ items: sensors })

  return (
    <Listbox.Root collection={sensorCollection} maxWidth={'1/2'}>
      <Listbox.Label>
        Select a sensor to edit it (does not work yet)
      </Listbox.Label>
      <Listbox.Content>
        {sensorCollection.items.map((sensor) => (
          <Listbox.Item item={sensor} key={sensor.sensor_id}>
            <Listbox.ItemText>{sensor.sensor_name}</Listbox.ItemText>
            <Listbox.ItemIndicator />
          </Listbox.Item>
        ))}
      </Listbox.Content>
    </Listbox.Root>
  )
}
const placeholderSensor: Sensor = {
  id: 1,
  name: 'Placeholder Sensor',
  mac: '12345',
  location: 'Gurula',
}
const SettingsPage = () => {
  return (
    <div>
      <Flex direction={'row'} gap={'10'} margin={'5'}>
        <SensorList
          sensors={[
            placeholderSensor,
            { ...placeholderSensor, id: 2 },
            { ...placeholderSensor, id: 3 },
          ]}
        />
      </Flex>
    </div>
  )
}

export default SettingsPage
