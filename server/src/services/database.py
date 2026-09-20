from typing import List, Optional, Tuple
from time import time
from contextlib import contextmanager
from collections.abc import Generator
from util.db_utils import DatabaseConnection, SensorItem, MeasurementItemFull, MeasurementItemSingular, MeasurementStatistic, GatewayEvent

class DatabaseService():
    _connection: DatabaseConnection
    is_open: bool
    file: str

    def __init__(self):
        self._db = DatabaseConnection()
        self.is_open = False


    def set_file(self, file: str):
        self.file = file
        self._db.database_filepath = file


    def open(self):
        self._db.open()
        self.is_open = True


    def enable_wal(self):
        self._db.enable_wal()


    def close(self):
        self.is_open = False
        self._db.close()


    # Get a connection for other thread
    @contextmanager
    def from_thread(self) -> Generator["DatabaseService"]:
        if not self.is_open:
            raise RuntimeError("Cannot open other thread database connection if initial connection not open!")
        new_service = DatabaseService()
        new_service.set_file(self.file)
        new_service.open()
        try:
            yield new_service
        finally:
            new_service.close()


    # MARK: Create sensor
    def create_sensor(self, name: str, mac: str) -> SensorItem:
        self._db.execute("INSERT INTO Sensors (name, mac, location) VALUES (?, ?, ?);", (
            name, mac, "unset"
        ))
        new_sensor = self.get_sensor_with_mac(mac)
        if not new_sensor:
            raise RuntimeError("Sensor creation failed")
        return new_sensor


    # MARK: Set sensor voltage
    def set_sensor_battery_voltage(self, sensor_id: int, voltage: float):
        sensor = self.get_sensor(sensor_id)
        if not sensor:
            print(f"ERROR: Cannot record battery voltage for unknown sensor ({sensor_id})")
            return

        self._db.execute("UPDATE Sensors SET battery_voltage = ? WHERE id = ?;", (voltage, sensor_id))


    # MARK: Get sensors
    def get_sensors(self) -> List[SensorItem]:
        rows = self._db.query("SELECT id, name, mac, location FROM Sensors", (), limit=None)
        return list(map(lambda row: SensorItem(*row), rows))


    def get_sensor(self, id: int) -> SensorItem | None:
        rows = self._db.query("SELECT id, name, mac, location FROM Sensors WHERE id = ?", (id,), limit=1)
        if len(rows) > 0:
            return SensorItem(*rows[0])
        return None


    def get_sensor_with_mac(self, mac: str) -> SensorItem | None:
        rows = self._db.query("SELECT id, name, mac, location FROM Sensors WHERE mac = ?", (mac,), limit=1)
        if len(rows) > 0:
            return SensorItem(*rows[0])
        return None


    # MARK: Get measurement stats
    def get_measurement_statistics(self) -> MeasurementStatistic:
        sensors = self.get_sensors()
        count_per_sensor = dict()
        id_to_mac = dict()
        for sensor in sensors:
            rows = self._db.query("SELECT COUNT(*) FROM Measurements WHERE sensor_id = ?", (sensor.id,), limit=1)
            count_per_sensor[sensor.id] = rows[0][0] if len(rows) > 0 else -1
            id_to_mac[sensor.id] = sensor.mac

        return MeasurementStatistic(id_to_mac,
                                    count_per_sensor)


    # MARK: Events
    def log_gateway_state(self, state: str):
        self._db.execute("INSERT INTO GatewayEvents (timestamp, state) VALUES (?, ?);", (
            time(), state
        ))


    def get_gateway_events(self) -> List[GatewayEvent]:
        rows = self._db.query("SELECT state, timestamp FROM GatewayEvents ORDER BY timestamp DESC", (), limit=None)
        return list(map(lambda row: GatewayEvent(*row), rows))


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
            "NOx",
            "during_calibration"
        ]
        latest = []
        for sensor in sensors:
            rows = self._db.query(
                f"SELECT {", ".join(keys)} FROM Measurements WHERE sensor_id = ? ORDER BY measurement_timestamp DESC",
                parameters=(sensor.id,),
                limit=1
            )
            if len(rows) > 0:
                latest.append(MeasurementItemFull(sensor, *rows[0]))

        return latest


    # MARK: Get historical
    def get_historical(self, sensor_id: int, start: Optional[int], end: Optional[int]) -> Tuple[SensorItem | None, List[MeasurementItemSingular]]:
        sensor = self.get_sensor(sensor_id)
        if not sensor:
            return (None, [])
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
            "NOx",
            "during_calibration"
        ]
        rows = self._db.query(
            " ".join([
                f"SELECT {", ".join(keys)} FROM Measurements",
                f"WHERE sensor_id = :id",
                "AND measurement_timestamp > :start" if start is not None else "",
                "AND measurement_timestamp < :end" if end is not None else "",
                "ORDER BY measurement_timestamp"
            ]),
            parameters={
                "id": sensor_id,
                "start": start,
                "end": end
            }
        )

        return (sensor, list(map(lambda row: MeasurementItemSingular(*row), rows)))


    # MARK: Insert measurement
    def insert_measurement(
        self,
        sensor_id: int,
        measurement_timestamp: int | None,
        rssi: int | None,
        mnum: int | None,
        during_calibration: bool | None,
        temperature: float | None,
        humidity: float | None,
        pressure: int | None,
        PM10: float | None,
        PM25: float | None,
        PM40: float | None,
        PM100: float | None,
        CO2: int | None,
        VOC: int | None,
        NOx: int | None
    ):
        self._db.execute(
            query="INSERT INTO Measurements (" +
                    "sensor_id," +
                    "measurement_timestamp," +
                    "insert_timestamp," +
                    "rssi," +
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
                  ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
            parameters=(
                sensor_id,
                measurement_timestamp,
                time(),
                rssi,
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

