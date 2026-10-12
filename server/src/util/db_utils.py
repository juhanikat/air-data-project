from sqlite3 import Error, connect, Connection, Cursor
from pathlib import Path
from typing import Any, List, Optional, Tuple, Union, Dict, Callable, Self
from dataclasses import dataclass

class DatabaseConnection:
    VERSION = 1
    migrations: dict[int, Callable[[], None]]

    def __init__(self, database = "./main.db", schema="./schema.sql", init="./init.sql"):
        self.database_filepath = database
        self.schema_filepath = schema
        self.init_filepath = init
        self.connection = None
        self.migrations = dict()


    def open(self):
        if self.connection:
            raise DatabaseException("Database already opened!")
        schema_file = Path(__file__).parent / Path(self.schema_filepath)
        if not schema_file.exists():
            raise DatabaseException("Schema file not found.")
        init_file = Path(__file__).parent / Path(self.init_filepath)
        if not init_file.exists():
            raise DatabaseException("Init file not found.")

        database_file = Path(self.database_filepath)
        if not database_file.exists():
            schema = schema_file.read_text("utf-8")
            self.connection = connect(database_file, timeout=10)
            self.connection.executescript(schema)
            init = init_file.read_text("utf-8")
            self.connection.executescript(init)
            self.connection.commit()
            self._set_user_version(self.VERSION)
        else:
            self.connection = connect(database_file, timeout=10)

        # Enforce foreign keys
        self.connection.execute("PRAGMA foreign_keys = ON;")

        # Force migrations
        self._migrate()

        return self


    def enable_wal(self):
        if self.connection:
            self.connection.execute("PRAGMA journal_mode=WAL;")
        else:
            raise RuntimeError("Must be connected to enable WAL")


    def close(self):
        if not self.connection:
            raise DatabaseException("Database not open!")
        self.connection.close()
        self.connection = None


    def execute(self, query: str, parameters: Union[Tuple[Any, ...], dict]) -> Tuple[Connection, Cursor]:
        if not self.connection:
            raise DatabaseException("Database not open!")
        
        try:
            cursor = self.connection.cursor()
            cursor.execute(query, parameters)
            self.connection.commit()
            return self.connection, cursor
        except Error as err:
            print("Database execution error:", err, "For:",
                  query, "With params:", parameters)
            self.connection.rollback()
            raise DatabaseException("Halting due to error. See above logs.")


    def query(self, query: str, parameters: Optional[Union[Tuple[Any, ...], dict]], limit: int | None = None) -> List[Any]:
        if not self.connection:
            raise DatabaseException("Database not open!")
        try:
            cursor = self.connection.cursor()
            cursor.execute(query, parameters or ())
            if limit is None:
                results = cursor.fetchall()
            else:
                results = cursor.fetchmany(limit)
            return results
        except Error as e:
            print("Database execution error:", e, "For:",
                  query, "With params:", parameters)
            raise DatabaseException("Halting due to error. See above logs.")


    def get_user_version(self) -> int:
        if not self.connection:
            raise DatabaseException("Database not open!")
                
        try:
            cursor = self.connection.cursor()
            return int(cursor.execute("PRAGMA user_version").fetchone()[0])
        except Error as err:
            print("Database execution error when getting version:", err)
            raise DatabaseException("Halting due to error. See above logs.")


    def _set_user_version(self, version: int):
        # NOTE: This is SQLi if misused :D
        self.execute(f"PRAGMA user_version = {int(version)};", dict())


    def register_migration(self, from_version: int, to_version: int, method: Callable[[Self], None]):
        def mig():
            method(self)
            self._set_user_version(to_version)


        self.migrations[from_version] = mig


    def _migrate(self):
        original_version = self.get_user_version()
        if original_version == self.VERSION:
            return

        print(f"Database requires migrations ({original_version} -> {self.VERSION})")

        # Perform migrations sequentially 
        def loop(version: int):
            if version not in self.migrations:
                # NOTE: If you get this, you are either missing a migration
                #       or you are running migrations from the wrong thread.
                #       Always create one connection in the main thread first before creating others.
                raise RuntimeError(f"Migration for version '{version}' not registered and database version is '{self.VERSION}'")

            print(f"Running migration {version}")
            self.migrations[version]()
            version_after_migrate = self.get_user_version()
            print("Database migrated to", version_after_migrate)
            if version_after_migrate != self.VERSION:
                print("Continuing migrations")
                loop(version_after_migrate)
            else:
                print(f"Database migrations done ({original_version} -> {self.VERSION})")

        loop(original_version)


class DatabaseException(Exception):
    def __init__(self, message):
        super().__init__(message)


@dataclass
class SensorItem:
    id: int
    name: str
    mac: str
    location: str

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "mac": self.mac,
            "location": self.location
        }


@dataclass
class MeasurementStatistic:
    sensors: Dict[int, str]
    entries_per_sensor: Dict[int, int]

    def to_dict(self):
        return {
            "sensors": self.sensors,
            "entries_per_sensor": self.entries_per_sensor
        }


@dataclass
class GatewayEvent:
    state: str
    timestamp: int

    def to_dict(self):
        return {
            "state": self.state,
            "timestamp": self.timestamp
        }


@dataclass
class MeasurementItemFull:
    sensor: SensorItem
    timestamp: int
    temperature: float | None
    humidity: float | None
    pressure: int | None
    pm10: float | None
    pm25: float | None
    pm40: float | None
    pm100: float | None
    co2: int | None
    voc: int | None
    nox: int | None
    during_calibration: bool | None


    def __post_init__(self):
        if self.during_calibration is not None:
            self.during_calibration = bool(self.during_calibration)


    def to_dict(self):
        return {
            "sensor": self.sensor.to_dict(),
            "timestamp": self.timestamp,
            "temperature": self.temperature,
            "humidity": self.humidity,
            "pressure": self.pressure,
            "pm10": self.pm10,
            "pm25": self.pm25,
            "pm40": self.pm40,
            "pm100": self.pm100,
            "co2": self.co2,
            "voc": self.voc,
            "nox": self.nox,
            "during_calibration": self.during_calibration
        }


@dataclass
class MeasurementItemSingular:
    timestamp: int
    temperature: float
    humidity: float
    pressure: int
    pm10: float
    pm25: float
    pm40: float
    pm100: float
    co2: int
    voc: int
    nox: int
    during_calibration: bool

    def __post_init__(self):
        if self.during_calibration is not None:
            self.during_calibration = bool(self.during_calibration)

    def to_dict(self):
        return {
            "timestamp": self.timestamp,
            "temperature": self.temperature,
            "humidity": self.humidity,
            "pressure": self.pressure,
            "pm10": self.pm10,
            "pm25": self.pm25,
            "pm40": self.pm40,
            "pm100": self.pm100,
            "co2": self.co2,
            "voc": self.voc,
            "nox": self.nox,
            "during_calibration": self.during_calibration
        }


@dataclass
class MeasurementItemScienceSingular:
    sensor_id: int
    timestamp: int
    temperature: float
    humidity: float
    pressure: float
    pm10: float
    pm25: float
    pm40: float
    pm100: float
    co2: float
    voc: float
    nox: float


@dataclass
class User:
    id: int
    name: str
    password_hash: str

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "password_hash": self.password_hash
        }
