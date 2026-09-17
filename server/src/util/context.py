from services.database import DatabaseService
from services.mqtt import MQTTClientService
from services.api import APIService

class Context:
    database: DatabaseService
    mqtt: MQTTClientService
    api: APIService


    def __init__(self,
    ):
        self.database = DatabaseService()
        self.mqtt = MQTTClientService()
        self.api = APIService()


    def destroy(self):
        """
        When you need to exit the program
        """
        self.mqtt.stop()
        self.database.close()
