import { useEffect, useState } from "react";
import {
  Brush,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import dataService from "./services/air-data";
import { SensorValueCard } from "./components/SensorValueCard";
import SettingsPage from "./pages/SettingsPage";
import { Tabs } from "@chakra-ui/react";

/**
 * Formats a Unix timestamp (seconds from 1970-01-01 00:00:00 UTC) as a local date-time string.
 *
 * @param {number} timestamp - Unix timestamp in seconds.
 * @returns {string} Formatted as "YYYY-MM-DD HH-MM-SS" in local time.
 */
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp * 1000);
  const pad = (value) => String(value).padStart(2, "0");
  // Use local time
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
  // Use UTC time
  //return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}-${pad(date.getUTCMinutes())}-${pad(date.getUTCSeconds())}`
};

const App = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    dataService.getData().then((data) =>
      // Add a formatted time property to each data point for display on the x-axis
      setData(
        data.map((item) => ({
          ...item,
          time: formatTimestamp(item.timestamp),
        })),
      ),
    );
  }, []);

  // Calculate how many data points there are in a week
  const pointsPerWeek =
    data.length > 1
      ? Math.ceil(
          (7 * 24 * 60 * 60) / Math.abs(data[0].timestamp - data[1].timestamp),
        )
      : 1;

  if (data.length > 1) {
    console.log(
      "Seconds between first and second data points:",
      data[1].timestamp - data[0].timestamp,
    );
    console.log("dataPointsPerWeek:", pointsPerWeek);
  }

  // Set the end and start indices for the brush component. User will see the last week by default.
  const defaultEndIndex = data.length > 1 ? data.length - 1 : 0;
  const defaultStartIndex =
    data.length > 1 ? Math.max(0, data.length - pointsPerWeek) : 0;

  console.log("defaultStartIndex:", defaultStartIndex);
  console.log("defaultEndIndex:", defaultEndIndex);

  const MainPage = () => {
    return (
      <div>
        <SensorValueCard
          type={"temperature"}
          label={"Test Temperature Card"}
          value={30.2}
          timestamp={new Date("2026-09-22")}
        />
        <SensorValueCard
          type={"percentage"}
          label={"Test Humidity Card"}
          value={55.5}
          timestamp={new Date("2026-09-20")}
        />

        <ResponsiveContainer width="100%" height={500}>
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, left: 10, bottom: 120 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              angle={-45}
              textAnchor="end"
              interval="preserveStart"
            />
            <YAxis />
            <Tooltip />
            {/* Place the range selector brush below the rotated time labels. */}
            <Brush
              dataKey="time"
              height={40}
              y={430}
              startIndex={defaultStartIndex}
              endIndex={defaultEndIndex}
            />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#8884d8"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>

        <h2>Data</h2>
        {data.map((item) => (
          <div key={item.id}>
            {item.time} | Temp: {item.temperature.toFixed(2)} | Humidity:{" "}
            {item.humidity}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <h1>Ebin Air Data Roject</h1>
      <Tabs.Root defaultValue="mainPage">
        <Tabs.List>
          <Tabs.Trigger value="mainPage">Main</Tabs.Trigger>
          <Tabs.Trigger value="settingsPage">Settings</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="mainPage">
          <MainPage />
        </Tabs.Content>
        <Tabs.Content value="settingsPage">
          <SettingsPage />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};

export default App;
