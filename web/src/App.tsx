import { useEffect, useState } from 'react'
import api, { DownsampledSensorReading, SensorData, User } from './services/api'
import SettingsPage from './pages/SettingsPage'
import MainPage from './pages/MainPage'
import { Container, Tabs } from '@chakra-ui/react'
import { LoadingScreen } from './components/LoadingScreen'
import { Header } from './components/Header'
import LoginPage from './pages/LoginPage'
import AccountPage from './pages/AccountPage'

const App = () => {
  const [sensorData, setSensorData] = useState<SensorData>()
  const [loadError, setLoadError] = useState<string | undefined>()
  const [page, setPage] = useState<string>("mainPage")
  const [user, setUser] = useState<User | undefined>(undefined)

  // Fetch data directly from icetea.esinko.net
  useEffect(() => {
    api
      .query(2, {
        downsample: true,
        sampling_method: 'mean',
        sample_interval: 360, // one sample every 10 seconds, 360 * 10 = 1 hour
        start: 0, // All data!
      })
      .then((data) => {
        // Format data to be just the values without "mean" key
        data.results = api.toSensorReadings(
          data.results as DownsampledSensorReading[],
          'mean'
        )

        setSensorData(data as SensorData)
      })
      .catch((err) => {
        console.error(err)
        setLoadError(err.toString())
      })
  }, [])

  useEffect(() => {
    api.getMe().then((user) => {
      if (user) {
        console.log("Logged in as:", user)
        setUser(user)
      }
    })
  }, [])

  if (!sensorData) {
    return <LoadingScreen error={loadError}/>
  }

  console.log('data from production:', sensorData)
  const sensorReadings = sensorData.results

  // Calculate how many data points there are in a week
  const pointsPerWeek =
    sensorReadings.length > 1
      ? Math.ceil(
          (7 * 24 * 60 * 60) /
            Math.abs(sensorReadings[0].timestamp - sensorReadings[1].timestamp)
        )
      : 1

  // Set the end and start indices for the brush component. User will see the last week by default.gs
  const defaultEndIndex =
    sensorReadings.length > 1 ? sensorReadings.length - 1 : 0
  const defaultStartIndex =
    sensorReadings.length > 1
      ? Math.max(0, sensorReadings.length - pointsPerWeek)
      : 0

  return (
    <Container pt={2}>
      <Header setPage={setPage} user={user}/>
      <Tabs.Root value={page} onValueChange={({ value }) => setPage(value)}>
        <Tabs.List>
          <Tabs.Trigger value="mainPage">Home</Tabs.Trigger>
          <Tabs.Trigger value="">Forecast</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="mainPage">
          <MainPage
            data={sensorData}
            defaultStartIndex={defaultStartIndex}
            defaultEndIndex={defaultEndIndex}
          />
        </Tabs.Content>
        <Tabs.Content value="settingsPage">
          <SettingsPage />
        </Tabs.Content>
        <Tabs.Content value="loginPage">
          <LoginPage setUser={(user) => {
            setUser(user)
            setPage("mainPage")
          }}/>
        </Tabs.Content>
        <Tabs.Content value="accountPage">
          <AccountPage setUser={(user) => {
            setUser(user)
            setPage("mainPage")
          }}/>
        </Tabs.Content>
      </Tabs.Root>
    </Container>
  )
}

export default App
