from services.database import DatabaseService
from services.mqtt import MQTTService
from services.api import APIService

class Context:
    database: DatabaseService
    mqtt: MQTTService
    api: APIService

    def __init__(self,
    ):
        self.database = DatabaseService()
        self.mqtt = MQTTService()
        self.api = APIService()
        
    def destroy(self):
        """
        When you need to exit the program
        """
