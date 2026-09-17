from typing import List
from time import time
from util.db_utils import DatabaseConnection, SensorItem, MeasurementItemFull, MeasurementItemSingular

class DatabaseService():
    _connection: DatabaseConnection
    file: str

    def __init__(self):
        self._db = DatabaseConnection()


    def set_file(self, file: str):
        self.file = file
        self._db.database_filepath = file


    def open(self):
        self._db.open()


    def close(self):
        self._db.close()


    # MARK: Create sensor
    def create_sensor(self, name: str, mac: str) -> SensorItem:
        self._db.execute("INSERT INTO Sensors VALUES (name, mac, location) VALUES (?, ?, ?)", (
            name, mac, "unset"
        ))
        new_sensor = self.get_sensor_with_mac(mac)
        if not new_sensor:
            raise RuntimeError("Sensor creation failed")
        return new_sensor


    # MARK: Get sensors
    def get_sensors(self) -> List[SensorItem]:
        rows = self._db.query("SELECT id, name, mac, location FROM Sensors", ())
        return list(map(lambda row: SensorItem(*row), rows))


    def get_sensor_with_mac(self, mac: str) -> SensorItem | None:
        rows = self._db.query("SELECT id, name, mac, location FROM Sensors WHERE mac = ? LIMIT 1", (mac,))
        if len(rows) > 0:
            return SensorItem(*rows)
        return None


    # MARK: Get latest
    def get_latest(self) -> List[MeasurementItemFull]:
        sensors = self.get_sensors()
        keys = [
            "measurement_timestamp",
            "temperature",
            "humidity",
            "pressure",
            "PM10",
            "PM25",
            "PM40",
            "PM100",
            "CO2",
            "VOC",
            "NOx"
        ]
        latest = []
        for sensor in sensors:
            rows = self._db.query(
                f"SELECT {", ".join(keys)} FROM Measurements WHERE sensor_id = ?",
                parameters=(sensor.id,)
            )
            if len(rows) > 0:
                latest.append(MeasurementItemFull(sensor, *rows[0]))

        return latest


    # MARK: Insert measurement
    def insert_measurement(
        self,
        sensor_id: int,
        measurement_timestamp: int,
        rssi: int,
        ble_phy: int,
        ble_chan: int,
        ble_tx_power: int,
        mnum: int,
        during_calibration: bool,
        temperature: float,
        humidity: float,
        pressure: int,
        PM10: float,
        PM25: float,
        PM40: float,
        PM100: float,
        CO2: int,
        VOC: int,
        NOx: int
    ):
        self._db.execute(
            query="INSERT INTO Measurements (" +
                    "sensor_id," +
                    "measurement_timestamp," +
                    "insert_timestamp," +
                    "rssi," +
                    "ble_phy," +
                    "ble_chan," +
                    "ble_tx_power," +
                    "mnum," +
                    "during_calibration," +
                    "temperature," +
                    "humidity," +
                    "pressure," +
                    "PM10," +
                    "PM25," +
                    "PM40," +
                    "PM100," +
                    "CO2," +
                    "VOC," +
                    "NOx" +
                  ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
            parameters=(
                sensor_id,
                measurement_timestamp,
                time(),
                rssi,
                ble_phy,
                ble_chan,
                ble_tx_power,
                mnum,
                during_calibration,
                temperature,
                humidity,
                pressure,
                PM10,
                PM25,
                PM40,
                PM100,
                CO2,
                VOC,
                NOx
            )
        )

