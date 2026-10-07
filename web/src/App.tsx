import { useEffect, useState } from 'react'
import api, { User } from './services/api'
import SettingsPage from './pages/SettingsPage'
import MainPage from './pages/MainPage'
import { Container, Tabs } from '@chakra-ui/react'
import { Header } from './components/Header'
import LoginPage from './pages/LoginPage'
import AccountPage from './pages/AccountPage'

const App = () => {
  const [page, setPage] = useState<string>('mainPage')
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
      <Header setPage={setPage} user={user} />
      <Tabs.Root value={page} onValueChange={({ value }) => setPage(value)}>
        <Tabs.List>
          <Tabs.Trigger value="mainPage">Home</Tabs.Trigger>
          <Tabs.Trigger value="">Forecast</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="mainPage">
          <MainPage />
        </Tabs.Content>
        <Tabs.Content value="settingsPage">
          <SettingsPage />
        </Tabs.Content>
        <Tabs.Content value="loginPage">
          <LoginPage
            setUser={(user) => {
              setUser(user)
              setPage('mainPage')
            }}
          />
        </Tabs.Content>
        <Tabs.Content value="accountPage">
          <AccountPage
            setUser={(user) => {
              setUser(user)
              setPage('mainPage')
            }}
          />
        </Tabs.Content>
      </Tabs.Root>
    </Container>
  )
}

export default App
