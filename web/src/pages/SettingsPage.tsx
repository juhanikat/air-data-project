import {
  Button,
  Field,
  Fieldset,
  Flex,
  Input,
  Listbox,
} from "@chakra-ui/react";
import { createListCollection } from "@chakra-ui/react";
import { SyntheticEvent } from "react";

export type Sensor = {
  sensor_id: number;
  sensor_name: string;
  sensor_mac: string;
  sensor_location: string | null;
};

type SensorListProps = {
  sensors: Sensor[];
};

type LoginInfo = {
  username: string;
  password: string;
};

const SensorList: React.FC<SensorListProps> = ({ sensors }) => {
  const sensorCollection = createListCollection({ items: sensors });

  return (
    <Listbox.Root collection={sensorCollection} maxWidth={"1/2"}>
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
  );
};
const placeholderSensor: Sensor = {
  sensor_id: 1,
  sensor_name: "Placeholder Sensor",
  sensor_mac: "12345",
  sensor_location: "Gurula",
};
const SettingsPage = () => {
  return (
    <div>
      <Flex direction={"row"} gap={"10"} margin={"5"}>
        <SensorList
          sensors={[
            placeholderSensor,
            { ...placeholderSensor, sensor_id: 2 },
            { ...placeholderSensor, sensor_id: 3 },
          ]}
        />
      </Flex>
    </div>
  );
};

export default SettingsPage;
