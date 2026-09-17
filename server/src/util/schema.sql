-- Sensor metadata
CREATE TABLE Sensors (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    mac TEXT NOT NULL,
    location TEXT
);

-- Sensor measurements
CREATE TABLE Measurements (
    id INTEGER PRIMARY KEY,
    sensor_id INTEGER NOT NULL REFERENCES Sensors(id) ON DELETE CASCADE,
    measurement_timestamp INTEGER NOT NULL,
    insert_timestamp INTEGER NOT NULL,
    -- Transmission metadata
    rssi INTEGER,
    ble_phy INTEGER,
    ble_chan INTEGER,
    ble_tx_power INTEGER,
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

-- User data
CREATE TABLE Users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL
);

-- Accelerate getting measurements for a specific sensor
CREATE INDEX measurement_sensor_id ON Measurements(sensor_id)
WHERE sensor_id IS NOT NULL;
