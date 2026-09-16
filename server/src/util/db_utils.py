from sqlite3 import Error, connect, Connection, Cursor
from pathlib import Path
from typing import Any, List, Optional, Tuple, Union
from dataclasses import dataclass

class DatabaseConnection:
    def __init__(self, database = "./main.db", schema="./util/schema.sql", init="./util/init.sql"):
        self.database_filepath = database
        self.schema_filepath = schema
        self.init_filepath = init
        self.connection = None

    def open(self):
        if self.connection:
            raise DatabaseException("Database already opened!")
        schema_file = Path(self.schema_filepath)
        if not schema_file.exists():
            raise DatabaseException("Schema file not found.")
        init_file = Path(self.init_filepath)
        if not init_file.exists():
            raise DatabaseException("Init file not found.")

        database_file = Path(self.database_filepath)
        if not database_file.exists():
            schema = schema_file.read_text("utf-8")
            self.connection = connect(database_file)
            self.connection.executescript(schema)
            init = init_file.read_text("utf-8")
            self.connection.executescript(init)
            self.connection.commit()
        else:
            self.connection = connect(database_file)

        # Enforce foreign keys
        self.connection.execute("PRAGMA foreign_keys = ON")
        return self

    def close(self):
        if not self.connection:
            raise DatabaseException("Database not open!")
        self.connection.close()

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

    def query(self, query: str, parameters: Optional[Union[Tuple[Any, ...], dict]], limit: int = -1) -> List[Any]:
        if not self.connection:
            raise DatabaseException("Database not open!")
        try:
            cursor = self.connection.cursor()
            cursor.execute(query, parameters or ())
            results = cursor.fetchmany(limit)
            return results
        except Error as e:
            print("Database execution error:", e, "For:",
                  query, "With params:", parameters)
            raise DatabaseException("Halting due to error. See above logs.")


class DatabaseException(Exception):
    def __init__(self, message):
        super().__init__(message)

@dataclass
class SensorItem:
    id: int
    name: str
    mac: str
    location: str

@dataclass
class MeasurementItemFull:
    sensor: SensorItem
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


@dataclass
class MeasurementItemSingular:
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

