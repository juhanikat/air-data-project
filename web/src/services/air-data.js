import axios from 'axios'

const baseUrl = 'http://localhost:3001'

const getData = async () => {
  const response = await axios.get(`${baseUrl}/airData`)
  return response.data
}

const getDataFromInternet = async () => {
  // Test fetching data from the internet.

  // Create a starting point 30 ago from current time.
  // const now = Date.now()
  // const days30 = 60 * 60 * 24 * 30 * 1000
  // const startTime = now - days30

  const response = await fetch('/air-api/api/v1/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ start: 1789809817, id: 1 }),
  })
  return response.json()
}

export default { getData, getDataFromInternet }
