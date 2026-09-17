from typing import Optional, TYPE_CHECKING
if TYPE_CHECKING:
    from util.context import Context
from util.mqtt_client import MQTTClient

class MQTTClientService:
    def __init__(self):
        self.client = MQTTClient()

    def register_listeners(self, context: "Context"):
        # MARK: Main listener
        @self.client.on_message(topic_prefix="ruuvi/#")
        def ruuvi_listener(topic: str, msg: dict):
            print("Received new measurement!", topic, msg)

            # ID is required to match data
            if "id" not in msg:
                print("ERROR: No sensor ID in Ruuvi message!")
                return

            # Handle sensor
            sensor_mac = msg["id"]
            sensor = context.database.get_sensor_with_mac(sensor_mac)
            if not sensor:
                print(f"Created new sensor entry: {sensor_mac}")
                sensor = context.database.create_sensor("Unnamed sensor", sensor_mac)

            # Add the measurement
            # TODO: Add method directly under sensor class?
            # NOTE: These keys are in proper order to expand into insert_measurement
            #       and they use the dict keys Ruuvi tags provide
            keys = [
                "timestamp",
                "rssi",
                "ble_phy",
                "ble_chan",
                "ble_tx_power",
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
                "NOX"
            ]
            for key in keys:
                if key not in msg:
                    print(f"ERROR: Missing required key from payload '{key}', cannot record measurement!")
                    return

            values = list(map(lambda key: msg[key], keys))
            context.database.insert_measurement(sensor_mac, *values)
            print(f"Measurement recorded (for {sensor_mac})")


    def listen(self, address: str, port: int, username: Optional[str], password: Optional[str]):
        try:
            self.client.listen(address, port, username, password)
        except Exception as e:
            print("Failed to establish")


    def stop(self):
        self.client.stop()
