from flask import Flask, request
from typing import Any, TYPE_CHECKING
from json import dumps
if TYPE_CHECKING:
    from util.context import Context

def conditionally_declare_GunicornApplication():
    from gunicorn.app.base import BaseApplication
    class GunicornApplication(BaseApplication):
        def __init__(self, app, options=None):
            self.application = app
            self.options = options or {}
            super().__init__()


        def load_config(self):
            for key, value in self.options.items():
                if key in self.cfg.settings and value is not None:
                    self.cfg.set(key.lower(), value)

        def load(self):
            return self.application


    return GunicornApplication


# MARK: Service class
class APIService():
    address: str
    gunicorn: Any
    app: Flask
    port: int
    listening: bool = False

    def __init__(self):
        self.app = Flask(__name__)


    def register_routes(self, context: "Context"):
        # MARK: /latest
        # Get all latest measurements
        @self.app.route("/api/v1/latest")
        def latest():
            # TODO: Authentication
            with context.database.from_thread() as database:
                data = database.get_latest()
            return dumps(list(map(lambda item: item.to_dict(), data)), indent=4), 200, {
                "Content-Type": "application/json"
            }

        # MARK: /query
        # Query historical data
        @self.app.route("/api/v1/query", methods=["POST"])
        def query():
            try:
                body = request.get_json()
            except Exception:
                return "Expected application/json", 400

            if "start" not in body and "end" not in body:
                return "Missing a required key 'start' or 'end'", 400
            if ("start" in body and type(body["start"]) != int) or ("end" in body and type(body["end"]) != int):
                return "Keys 'start' and 'end' bust be undefined or int", 400
            if "id" not in body or type(body["id"]) != int:
                return "Key 'id' (sensor id) required", 400
            
            with context.database.from_thread() as database:
                start = body["start"] if "start" in body else None
                end = body["end"] if "end" in body else None
                sensor, items = database.get_historical(body["id"], start, end)
                if sensor is None:
                    return dumps({ "sensor": None, "results": [] }, indent=4), 200
                return dumps({
                    "sensor": sensor.to_dict(),
                    "results": list(map(lambda item: item.to_dict(), items))
                })

        # MARK: /stats
        # Get stats for stored measurements
        @self.app.route("/api/v1/stats")
        def stats():
            with context.database.from_thread() as database:
                data = database.get_measurement_statistics()
                
            return dumps(data.to_dict(), indent=4), 200, {
                "Content-Type": "application/json"
            }
        

        # MARK: /list
        # Get list of sensors
        @self.app.route("/api/v1/sensors")
        def list_data():
            with context.database.from_thread() as database:
                data = database.get_sensors()

            return dumps(list(map(lambda item: item.to_dict(), data)), indent=4), 200, {
                "Content-Type": "application/json"
            }


    def listen(self, address: str = "127.0.0.1", port: int = 8000, development_mode: bool = False):
        if self.listening:
            raise RuntimeError("Called listen twice!")

        self.listening = True
        self.address = address
        self.port = port

        if not development_mode:
            # NOTE: We need to this trick to make development mode work on Windows
            GunicornApplication = conditionally_declare_GunicornApplication()
            GunicornApplication(self.app, {
                "bind": f"{address}:{port}",
                "workers": 4,
            }).run()
        else:
            self.app.run(host=self.address, port=self.port, debug=False) 
