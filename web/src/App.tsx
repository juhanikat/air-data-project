import { Container, Tabs } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { Header } from './components/Header'
import AccountPage from './pages/AccountPage'
import ForecastPage from './pages/ForecastPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import MeasurementsPage from './pages/MeasurementsPage'
import SettingsPage from './pages/SettingsPage'
import StatisticsPage from './pages/StatisticsPage'
import api, { User } from './services/api'

const App = () => {
  const [page, setPage] = useState<string>('homePage')
  const [prevPage, setPrevPage] = useState<string>()
  const [user, setUser] = useState<User | undefined>(undefined)

  // Fetch data directly from icetea.esinko.net

  useEffect(() => {
    api.getMe().then((user) => {
      if (user) {
        console.log('Logged in as:', user)
        setUser(user)
      }
    })
  }, [])

  return (
    <Container pt={2}>
      <Header
        setPage={(value) => {
          setPrevPage(page)
          setPage(value)
        }}
        user={user}
      />
      <Tabs.Root
        value={page}
        onValueChange={({ value }) => {
          setPrevPage(page)
          setPage(value)
        }}
        lazyMount
        unmountOnExit
      >
        <Tabs.List>
          <Tabs.Trigger value="homePage">Home</Tabs.Trigger>
          <Tabs.Trigger value="measurementsPage">Measurements</Tabs.Trigger>
          <Tabs.Trigger value="statisticsPage">Statistics</Tabs.Trigger>
          <Tabs.Trigger value="forecastPage">Forecast</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="homePage">
          <HomePage />
        </Tabs.Content>
        <Tabs.Content value="measurementsPage">
          <MeasurementsPage />
        </Tabs.Content>
        <Tabs.Content value="statisticsPage">
          <StatisticsPage />
        </Tabs.Content>
        <Tabs.Content value="settingsPage">
          <SettingsPage />
        </Tabs.Content>
        <Tabs.Content value="loginPage">
          <LoginPage
            setUser={(user) => {
              setUser(user)
              setPage(prevPage ?? 'homePage')
            }}
          />
        </Tabs.Content>
        <Tabs.Content value="accountPage">
          <AccountPage
            setUser={(user) => {
              setUser(user)
              setPage(prevPage ?? 'homePage')
            }}
          />
        </Tabs.Content>
        <Tabs.Content value="forecastPage">
          <ForecastPage user={user} />
        </Tabs.Content>
      </Tabs.Root>
    </Container>
  )
}

export default App
