from services.database import DatabaseService
from util.db_utils import DatabaseConnection
from util.science import downSampleMeasurementsTo
from time import time
from sys import stdout

def clear_line():
    print("\r\033[2K", end="", flush=True)


def from_0_to_1(conn: DatabaseConnection):
    # Reuse DB-connection
    database = DatabaseService()
    database._db = conn
    database.is_open = True

    # Create ScienceHourlyMeanMeasurements table
    print("Adding table ScienceHourlyMeanMeasurements")
    conn.execute("""
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
    """, dict())

    print("Adding science_hourly_mean_sensor_id index")
    conn.execute("CREATE INDEX science_hourly_mean_sensor_id ON ScienceHourlyMeanMeasurements(sensor_id) WHERE sensor_id IS NOT NULL;", dict())

    print("Adding idx_measurements_sensor_timestamp index")
    conn.execute("CREATE INDEX idx_measurements_sensor_timestamp ON Measurements(sensor_id, measurement_timestamp DESC);", dict())

    # Create contents from old raw measurement data
    sensors = database.get_sensors()
    print(f"Backfilling data")

    i = -1
    for sensor in sensors:
        i += 1
        # Get the mean data and downsample
        _, items = database.get_historical(sensor.id, 0, int(time() + 1))
        items = downSampleMeasurementsTo(items, "mean", 3600)
        print(f"Backfilling {sensor.id} ({i}/{len(sensors)})")

        # Insert to db
        ii = -1
        for item in items:
            ii += 1
            clear_line()
            stdout.write(f"item: {ii}/{len(items)}")
            database.insert_science_hourly_mean(
                sensor.id, item.timestamp, item.temperature.mean, item.humidity.mean,
                item.pressure.mean, item.pm10.mean, item.pm25.mean, item.pm40.mean,
                item.pm100.mean, item.co2.mean, item.voc.mean, item.nox.mean
            )

        clear_line()
        print("< done >")
