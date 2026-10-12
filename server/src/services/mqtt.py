from typing import Optional, TYPE_CHECKING
if TYPE_CHECKING:
    from util.context import Context
from util.mqtt_client import MQTTClient
from threading import Thread
from time import time
from traceback import format_exception
from util.science import downSampleMeasurementsTo

class MQTTClientService:
    thread: Thread | None

    def __init__(self):
        self.client = MQTTClient()
        self.thread = None

    def register_listeners(self, context: "Context"):
        # MARK: Main listener (# is wildcard)
        @self.client.on_message(topic="ruuvi/#")
        def ruuvi_listener(topic: str, msg: dict):
            # ID is required to match data
            if "id" not in msg:
                # Log gateway state messages
                if "state" in msg:
                    with context.database.from_thread() as database:
                        database.log_gateway_state(msg["state"])

                    print("Gateway state is:", msg["state"])
                    return
                
                print("ERROR: Unknown Ruuvi message:", topic, msg)
                return

            # Handle sensor
            sensor_mac = msg["id"]
            with context.database.from_thread() as database:
                sensor = database.get_sensor_with_mac(sensor_mac)
                if not sensor:
                    print(f"Created new sensor entry: {sensor_mac}")
                    sensor = database.create_sensor("Unnamed sensor", sensor_mac)

                # Record battery voltage, if value present
                if "voltage" in msg:
                    database.set_sensor_battery_voltage(sensor.id, msg["voltage"])

            # Add the measurement
            # TODO: Add method directly under sensor class?
            # NOTE: These keys are in proper order to expand into insert_measurement
            #       and they use the dict keys Ruuvi tags provide
            keys = [
                "ts",
                "rssi",
                "measurementSequenceNumber",
                "flag_calibration_in_progress",
                "temperature",
                "humidity",
                "pressure",
                "PM1.0",
                "PM2.5",
                "PM4.0",
                "PM10.0",
                "CO2",
                "VOC",
                "NOx"
            ]

            supported_data_formats = [225, 5]

            # Data format 5 contains less keys
            keys_not_in_data_format_5 = [
                "flag_calibration_in_progress",
                "humidity",
                "pressure",
                "PM1.0",
                "PM2.5",
                "PM4.0",
                "PM10.0",
                "CO2",
                "VOC",
                "NOx"
            ]

            if msg["dataFormat"] not in supported_data_formats:
                print("ERROR: Unsupported data MQTT data format:", msg)
                return

            for key in keys:
                if key not in msg and not (msg["dataFormat"] == 5 and key in keys_not_in_data_format_5):
                    print(f"ERROR: Missing required key from payload '{key}', cannot record measurement!")
                    print("Payload was:", msg)
                    return

            values = list(map(lambda key: msg.get(key, None), keys))
            with context.database.from_thread() as database:
                database.insert_measurement(sensor.id, *values)
                print(f"Measurement recorded (for {sensor_mac} aka. {sensor.id})")

            # MARK: Science
            # Check if there's a mean for the last full hour
            last_hour = (int(time()) // 3600) * 3600 - 3600
            with context.database.from_thread() as database:
                try:
                    last_mean_entry = database.get_last_science_hourly_mean(sensor.id)
                    if not last_mean_entry or last_hour != last_mean_entry.timestamp:
                        print("Time to create science data!")
                        # Create mean entry for the last hour
                        _, items = database.get_historical(sensor.id, last_hour, last_hour + 3600 + 1)
                        items = downSampleMeasurementsTo(items, "mean", 3600)
                        item = items[0]
                        if not item:
                            print("ERROR: Failed to generate mean for last hour for science table for sensor", sensor.id, "reason: no data")
                        else:
                            database.insert_science_hourly_mean(
                                sensor.id, item.timestamp, item.temperature.mean, item.humidity.mean,
                                item.pressure.mean, item.pm10.mean, item.pm25.mean, item.pm40.mean,
                                item.pm100.mean, item.co2.mean, item.voc.mean, item.nox.mean
                            )
                            print(f"Generated science data for {sensor.id} index {last_hour}")
                except Exception as e:
                    print("ERROR: Failed to generate mean for last hour for science table for sensor", sensor.id, "reason:", *format_exception(e))
                    

    def listen(self, address: str, port: int, username: Optional[str], password: Optional[str]):
        def _listen():
            try:
                self.client.listen(address, port, username, password)
            except Exception as e:
                print(f"Failed to establish: {e}")

        self.thread = Thread(target=_listen, daemon=True)
        self.thread.start()


    def stop(self):
        self.client.stop()
