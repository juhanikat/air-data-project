import { Sensor } from "@/services/api"
import {
    Box,
    Button,
    Field,
    Heading,
    Input,
    Stack,
    Text,
} from "@chakra-ui/react"
import { useEffect, useState } from "react"

type SensorFormProps = {
    sensors: Sensor[]
    onSave: (sensor: Sensor) => void | Promise<void>
}

export function SensorSettings({ sensors, onSave }: SensorFormProps){
    const [originals, setOriginals] = useState<Sensor[]>([])
    const [saving, setSaving] = useState<number>()
    const [sensorValues, setSensorValues] = useState<{[key: number]: Sensor}>({})

    useEffect(() => {
        (async () => {
            setOriginals(sensors)
            setSensorValues(Object.fromEntries(sensors.map((sensor) => [sensor.id, sensor])))
            setSaving(undefined)
        })()
    }, [sensors])

    function updateSensor(
        id: number,
        field: "name" | "location",
        value: string
    ){
        const newValues = JSON.parse(JSON.stringify(sensorValues))
        newValues[id] = { ...newValues[id], [field]: value }
        setSensorValues(newValues)
    }

    return (
        <Stack gap={4}>
            {originals.map((sensor) => (
                <Box
                    key={sensor.id}
                    border="1px solid"
                    borderColor="blackAlpha.300"
                    borderRadius="12px"
                    p={5}
                >
                    <Stack gap={4}>
                        <Heading size="lg">ID: {sensor.id}</Heading>

                        <Field.Root>
                            <Field.Label>Name</Field.Label>
                            <Input
                                value={sensorValues[sensor.id]?.name}
                                disabled={saving !== undefined}
                                onChange={(e) =>
                                    updateSensor(sensor.id, "name", e.target.value)
                                }
                            />
                        </Field.Root>

                        <Field.Root>
                            <Field.Label>Location</Field.Label>
                            <Input
                                value={sensorValues[sensor.id]?.location}
                                disabled={saving !== undefined}
                                onChange={(e) =>
                                    updateSensor(sensor.id, "location", e.target.value)
                                }
                            />
                        </Field.Root>

                        <Box>
                            <Text fontSize="sm" fontWeight="medium" mb={1}>
                                Mac
                            </Text>

                            <Input
                                value={sensor.mac}
                                readOnly
                                bg="gray.100"
                            />
                        </Box>

                        <Button
                            alignSelf="flex-end"
                            loading={saving === sensor.id}
                            disabled={JSON.stringify(sensorValues[sensor.id]) === JSON.stringify(sensor) || saving !== undefined}
                            onClick={() => {
                                onSave(sensorValues[sensor.id])
                                setSaving(sensor.id)
                            }}
                        >
                            Save
                        </Button>
                    </Stack>
                </Box>
            ))}
        </Stack>
    )
}

export default SensorSettings