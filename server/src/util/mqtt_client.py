from threading import Lock
from typing import Callable, List, Optional
from json import loads
from time import sleep
from traceback import format_exception
import paho.mqtt.client as mqtt
from paho.mqtt.enums import CallbackAPIVersion

class MQTTClient:
    address: str
    port: int
    listening: bool
    _listeners: dict[str, List[Callable]]

    def __init__(self):
        self._topics: set[str] = set()
        self._lock = Lock()
        self.client = mqtt.Client(CallbackAPIVersion.VERSION2)
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_mqtt_message
        self._listeners = dict()
        self.listening = False
        self.connected = False


    def _on_connect(
        self,
        client,
        userdata,
        flags,
        reason_code,
        properties
    ):
        if reason_code == "Success":
            print(f"Connected to MQTT broker ({reason_code})")
            self.connected = True
        else:
            print("ERROR: Failed to connect to MQTT server:", reason_code)


    def _on_disconnect(
        self,
        client,
        userdata,
        disconnect_flags,
        reason_code,
        properties
    ):
        self.connected = False
        print("WARNING: Connection to MQTT server lost:", reason_code)
        sleep(3)
        print("Retrying ...")
        self._connect()


    def _on_mqtt_message(self, client, userdata, msg):
        with self._lock:
            try:
                payload = loads(msg.payload)
                for topic_prefix in self._listeners.keys():
                    if topic_prefix.startswith(msg.topic):
                        for handler in self._listeners[topic_prefix]:
                            try:
                                handler(msg.topic, payload)
                            except Exception as e:
                                print(f"Error in on_message for '{topic_prefix}' at {handler}", *format_exception(e))
            except Exception as e:
                print("Error in MQTT message handler", *format_exception(e))


    def on_message(self, topic_prefix: str) -> Callable:
        def decorator(handler: Callable[[str, dict], None]):
            self.client.subscribe(topic_prefix)
            if topic_prefix not in self._listeners:
                self._listeners[topic_prefix] = list()
            self._listeners[topic_prefix].append(handler)
            
        return decorator


    def _connect(self):
        try:
            self.client.connect(self.address, self.port, 60)
            self.client.loop_start()
        except Exception as e:
            print("ERROR: MQTT connect failed", *format_exception(e))
            sleep(3)
            print("Retrying ...")
            self._connect()


    def listen(self, address: str, port: int, username: Optional[str], password: Optional[str]):
        if self.listening:
            raise RuntimeError("Listen called twice!")

        self.address = address
        self.port = port
        if username and password:
            self.client.username_pw_set(
                username=username,
                password=password,
            )
        else:
            print("WARNING! Not using authentication for MQTT!")
        self._connect()


    def stop(self):
        self.client.loop_stop()
        self.client.disconnect()
