import { Sensor } from '../services/api'
import { useEffect, useState } from 'react'
import api from "../services/api"
import { SensorSettings } from '../components/SensorSettings'
import { Heading, Stack, Text } from '@chakra-ui/react'

const SettingsPage = () => {
    const [sensors, setSensors] = useState<Sensor[]>()
    useEffect(() => {
        (async () => {
            const liveSensors = await api.getAllSensors()
            console.log(sensors)
            setSensors(liveSensors)
        })();
    }, [])

    return <Stack mb={5}>
        <Heading size="xl">Settings</Heading>
        <Text mb={4}>Edit metadata for each sensor.</Text>
        <SensorSettings
            sensors={sensors ?? []}
            onSave={(sensor) => {
                api.editSensor(sensor)
                    .then(async () => {
                        const liveSensors = await api.getAllSensors()
                        console.log(sensors)
                        setSensors(liveSensors)
                    })
            }}
        />
    </Stack>
}

export default SettingsPage
