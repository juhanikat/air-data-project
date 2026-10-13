import { Heading, Link, Text } from '@chakra-ui/react'

const HomePage = () => {
  return (
    <div>
      <Heading>Introduction</Heading>
      <Text>
        Guru-Air Monitor collects sensor readings from air quality sensors
        inside the Gurula student room and other nearby rooms at the Kumpula
        campus, and displays the readings in different ways. It also allows for
        the creation of forecasts predicting future changes in air quality. This
        project was made for the Data Science master's course at the University
        of Helsinki.
      </Text>
      <br></br>
      <Text>
        The "Measurements" tab shows the all the latest readings for all
        sensors. The "Statistics" tab charts historical sensor data for all
        readings, and lets you choose which sensors to display on the charts.
        The "Forecast" tab lets logged in users generate and display 2-day
        predictions for any reading using the SARIMAX statistical model. Logged
        in users can also change the displayed names and locations of the
        sensors.
      </Text>
      <br></br>
      <Text>
        The source is available at:{' '}
        <Link href="https://github.com/juhanikat/air-data-project">
          https://github.com/juhanikat/air-data-project
        </Link>
      </Text>
      <br></br>
      <Heading>Authors</Heading>
      <Text>Jaakko Airikkala</Text>
      <Text>Eemil Sinkko</Text>
      <Text>Juhani Kataja</Text>
    </div>
  )
}

export default HomePage
