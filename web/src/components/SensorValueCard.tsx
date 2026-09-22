import { Card, Flex, Stat } from "@chakra-ui/react";

export type SensorValueCardProps = {
  type: "temperature" | "percentage";
  label: string;
  value: number;
  timestamp: Date;
};

export type Time = {
  value: number;
  unit: "second" | "minute" | "hour" | "day";
};

export const SensorValueCard: React.FC<SensorValueCardProps> = ({
  type,
  label,
  value,
  timestamp,
}) => {
  const timestampToTime = (): Time => {
    const msSinceReading = Date.now() - timestamp.getTime();
    const secondsSinceReading = msSinceReading / 1000;
    const minutesSinceReading = secondsSinceReading / 60;
    const hoursSinceReading = minutesSinceReading / 60;

    if (secondsSinceReading < 60) {
      return { value: Math.round(secondsSinceReading), unit: "second" };
    } else if (minutesSinceReading < 60) {
      return { value: Math.round(minutesSinceReading), unit: "minute" };
    } else if (hoursSinceReading < 24) {
      return { value: Math.round(hoursSinceReading), unit: "hour" };
    } else {
      return { value: Math.round(hoursSinceReading / 24), unit: "day" };
    }
  };

  const time = timestampToTime();
  const unit = time.value === 1 ? time.unit : time.unit + "s";
  const color = type === "temperature" ? "red.100" : "blue.100";

  return (
    <Card.Root width="320px">
      <Card.Body gap="2" bgColor={color}>
        <Stat.Root>
          <Flex direction={"column"}>
            <Flex>
              <Stat.Label>{label}</Stat.Label>
            </Flex>
            <Flex>
              <Stat.ValueText>
                {value} {type === "temperature" ? "°C" : "%"}
              </Stat.ValueText>
            </Flex>
            <Flex justify={"flex-end"}>
              <Stat.ValueText alignItems={"baseline"}>
                {time.value} <Stat.ValueUnit>{unit} ago</Stat.ValueUnit>
              </Stat.ValueText>
            </Flex>
          </Flex>
        </Stat.Root>
      </Card.Body>
    </Card.Root>
  );
};
