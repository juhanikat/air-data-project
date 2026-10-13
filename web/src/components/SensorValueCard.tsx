import { SensorReading } from '@/services/api'
import { Card, Flex, Stat } from '@chakra-ui/react'

export const SensorValueCard = ({
  /** The name of the sensor reading. */
  label,
  /** If given, automatically colors the Card and formats the value. */
  dataKey,
  /** The value :D */
  value,
  /** If datakey is not given, this object can be used to format the value and color the Card however you like. */
  customDisplayOptions,
}: {
  label: string
  dataKey?: keyof SensorReading
  value: number
  timestamp: Date
  customDisplayOptions?: {
    color: string
    formattedValue: string
    valueUnit: string
  }
}) => {
  if (!dataKey && !customDisplayOptions) {
    console.error(
      'Custom data options must be passed if the dataKey is not given.'
    )
  }

  let formattedValue = ''
  let valueUnit = ''
  let color = ''

  if (customDisplayOptions) {
    color = customDisplayOptions.color
    formattedValue = customDisplayOptions.formattedValue
    valueUnit = customDisplayOptions.valueUnit
  } else {
    switch (dataKey) {
      case 'temperature':
        color = 'red.100'
        formattedValue = value.toFixed(1)
        valueUnit = ' °C'
        break
      case 'humidity':
        color = 'blue.100'
        formattedValue = value.toFixed(1)
        valueUnit = ' %'
        break
      case 'pressure':
        color = 'green.100'
        formattedValue = value.toFixed(0)
        valueUnit = ' Pa'
        break
      case 'pm10':
        color = 'pink.100'
        formattedValue = value.toFixed(2)
        valueUnit = ' ppm'
        break
      case 'pm25':
        color = 'pink.100'
        formattedValue = value.toFixed(2)
        valueUnit = ' ppm'
        break
      case 'pm100':
        color = 'pink.100'
        formattedValue = value.toFixed(2)
        valueUnit = ' ppm'
        break
      case 'co2':
        color = 'gray.100'
        formattedValue = value.toFixed(0)
        valueUnit = ' ppm'
        break
      case 'voc':
        color = 'green.200'
        formattedValue = value.toFixed(0)
        valueUnit = ''
        break
      case 'nox':
        color = 'orange.200'
        formattedValue = value.toFixed(0)
        valueUnit = ''
        break
    }
  }

  return (
    <Card.Root maxWidth="15%">
      <Card.Body gap="2" bgColor={color}>
        <Stat.Root>
          <Flex direction={'column'}>
            <Flex>
              <Stat.Label>{label}</Stat.Label>
            </Flex>
            <Flex>
              <Stat.ValueText>
                {formattedValue} {valueUnit}
              </Stat.ValueText>
            </Flex>
          </Flex>
        </Stat.Root>
      </Card.Body>
    </Card.Root>
  )
}
