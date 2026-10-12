-- Sensor metadata
CREATE TABLE Sensors (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    mac TEXT NOT NULL,
    location TEXT,
    battery_voltage FLOAT
);

-- Sensor measurements
CREATE TABLE Measurements (
    id INTEGER PRIMARY KEY,
    sensor_id INTEGER NOT NULL REFERENCES Sensors(id) ON DELETE CASCADE,
    measurement_timestamp INTEGER NOT NULL,
    insert_timestamp INTEGER NOT NULL,
    -- Transmission metadata
    rssi INTEGER,
    mnum INTEGER,
    during_calibration BOOLEAN,
    -- Actual data
    temperature FLOAT,
    humidity FLOAT,
    pressure INTEGER,
    PM10 FLOAT,
    PM25 FLOAT,
    PM40 FLOAT,
    PM100 FLOAT,
    CO2 INTEGER,
    VOC INTEGER,
    NOx INTEGER
);

-- Used by SARIMA algorithm for forecasting
CREATE TABLE ScienceHourlyMeanMeasurements (
    id INTEGER PRIMARY KEY,
    series_index INTEGER,
    sensor_id INTEGER NOT NULL REFERENCES Sensors(id) ON DELETE CASCADE,
    timestamp INTEGER NOT NULL,
    temperature FLOAT,
    humidity FLOAT,
    pressure FLOAT,
    PM10 FLOAT,
    PM25 FLOAT,
    PM40 FLOAT,
    PM100 FLOAT,
    CO2 FLOAT,
    VOC FLOAT,
    NOx FLOAT
);

-- Logs gateway events to detect disturbance
CREATE TABLE GatewayEvents (
    id INTEGER PRIMARY KEY,
    timestamp INTEGER NOT NULL,
    state BOOLEAN
);

-- User data
CREATE TABLE Users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL
);

-- Accelerate getting measurements for a specific sensor
CREATE INDEX measurement_sensor_id ON Measurements(sensor_id)
WHERE sensor_id IS NOT NULL;

-- Accelerate getting science hourly mean for a specific sensor
CREATE INDEX science_hourly_mean_sensor_id ON ScienceHourlyMeanMeasurements(sensor_id)
WHERE sensor_id IS NOT NULL;

-- Accelerate getting last measurement
CREATE INDEX idx_measurements_sensor_timestamp ON Measurements(sensor_id, measurement_timestamp DESC);