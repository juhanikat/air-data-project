# Eclipse Mosquitto
This is the configuration, data and log directory for the Open Source MQTT broker Mosquitto built by the Eclipse Foundation.

In this project, the role of the MQTT broker is to receive messages from sensors and relay them to the backend. This is standard architecture for MQTT, as having a standalone broker service removes the single point of failure in data collection. Additionally the MQTT broker is a complex piece of software and is better implemented in other languages than Python (there isn't a Python based MQTT broker available)

See the [config](./config/) folder for the broker config. The [data](./data/) and [log](./log/) directories will be mounted to the Mosquitto container directly, so you can find persistent data and logs from the broker there.
