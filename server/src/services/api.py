from flask import Flask, request, session
from typing import Any, TYPE_CHECKING
from json import dumps
from time import time
from multiprocessing import Process
from flask_cors import CORS
from random import randbytes
from threading import Thread
from werkzeug.security import check_password_hash
from util.science import downSampleMeasurementsTo
from util.auth import refresh_session, requires_authentication
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
    thread: Thread | None
    process: Process | None

    def __init__(self):
        self.app = Flask(__name__)
        self.app.config["SESSION_COOKIE_HTTPONLY"] = True
        self.app.config["SESSION_COOKIE_SAMESITE"] = "Strict"
        self.app.secret_key = randbytes(256)
        self.thread = None
        self.process = None


    def register_routes(self, context: "Context"):
        # MARK: /latest
        # Get all latest measurements
        @self.app.route("/api/v1/latest")
        @refresh_session
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
        @refresh_session
        def query():
            try:
                body = request.get_json()
            except Exception:
                return "Expected application/json", 400

            if "start" not in body and "end" not in body:
                return "Missing a required key 'start' or 'end'", 400
            if ("start" in body and type(body["start"]) != int) or ("end" in body and type(body["end"]) != int):
                return "Keys 'start' and 'end' must be undefined or int", 400
            if "id" not in body or type(body["id"]) != int:
                return "Key 'id' (sensor id) required", 400
            if "downsample" in body and type(body["downsample"]) != bool:
                return "Key 'downsample' must be undefined or bool", 400
            if body["downsample"] and ("sampling_method" not in body or (type(body["sampling_method"]) != str and type(body["sampling_method"]) != list)):
                return "Key 'sampling_method' must be str or list", 400
            if body["downsample"] and ("sample_interval" not in body or type(body["sample_interval"]) != int):
                return "Key 'sample_interval' must be int", 400

            # Database fetch
            with context.database.from_thread() as database:
                start = body["start"] if "start" in body else None
                end = body["end"] if "end" in body else None
                sensor, items = database.get_historical(body["id"], start, end)
                if sensor is None:
                    return dumps({ "sensor": None, "results": [] }, indent=4), 200

            # Downsampling
            if body["downsample"]:
                items = downSampleMeasurementsTo(items, body["sampling_method"], body["sample_interval"])

            return dumps({
                "sensor": sensor.to_dict(),
                "downsampled": body["downsample"] == True,
                "results": list(map(lambda item: item.to_dict(), items))
            })

        # MARK: /stats
        # Get stats for stored measurements
        @self.app.route("/api/v1/stats")
        @refresh_session
        def stats():
            with context.database.from_thread() as database:
                data = database.get_measurement_statistics()
                
            return dumps(data.to_dict(), indent=4), 200, {
                "Content-Type": "application/json"
            }
        

        # MARK: /list
        # Get list of sensors
        @self.app.route("/api/v1/sensors")
        @refresh_session
        def list_data():
            with context.database.from_thread() as database:
                data = database.get_sensors()

            return dumps(list(map(lambda item: item.to_dict(), data)), indent=4), 200, {
                "Content-Type": "application/json"
            }


        # MARK: /gateway-events
        @self.app.route("/api/v1/gateway-events")
        @refresh_session
        def list_events():
            with context.database.from_thread() as database:
                data = database.get_gateway_events()

            result = {
                "last_event_delta": int(time()) - (data[0].timestamp if len(data) > 0 else -int(time())),
                "events": list(map(lambda item: item.to_dict(), data))
            }
            return dumps(result, indent=4), 200, {
                "Content-Type": "application/json"
            }

        # MARK: /login
        @self.app.route("/api/v1/login", methods=["POST"])
        def login():
            try:
                body = request.get_json()
            except Exception:
                return "Expected application/json", 400

            if "username" not in body or type(body["username"]) != str:
                return "Key 'username' must be str", 400
            if "password" not in body or type(body["password"]) != str:
                return "Key 'password' must be str", 400

            with context.database.from_thread() as database:
                user = database.get_user(body["username"])

            # Always compare against something to prevent timing attacks
            compare_to = user.password_hash if user else randbytes(8).hex()
            password_matches = check_password_hash(compare_to, body["password"])
            if user is None or not password_matches:
                return "Invalid username or password", 401

            # Add session
            session["user"] = {
                "id": user.id,
                "name": user.name,
                "last_used": time()
            }

            return dumps({ "id": user.id, "name": user.name }), 200

        # MARK: /me
        @self.app.route("/api/v1/me")
        @requires_authentication
        @refresh_session
        def me():
            user = session["user"]
            return dumps({ "id": user["id"], "name": user["name"] }), 200


        # MARK: /logout
        @self.app.route("/api/v1/logout")
        @requires_authentication
        def logout():
            del session["user"]
            return "Session deleted", 200


        # MARK: /edit-sensor
        @self.app.route("/api/v1/edit-sensor", methods=["POST"])
        @requires_authentication
        @refresh_session
        def edit_sensor():
            try:
                body = request.get_json()
            except Exception:
                return "Expected application/json", 400

            if "id" not in body or type(body["id"]) != int:
                return "Key 'id' must be int", 400
            if "name" in body and type(body["name"]) != str:
                return "Key 'name' must be str or undefined", 400
            if "location" in body and type(body["location"]) != str:
                return "Key 'location' must be str or undefined", 400

            with context.database.from_thread() as database:
                sensor = database.get_sensor(body["id"])
                if sensor is None:
                    return "No such sensor", 400

                new_name = body["name"] if "name" in body else sensor.name
                new_location = body["location"] if "location" in body else sensor.location
                if len(new_name) > 64 or len(new_location) > 64:
                    return "Name and location max length is 64 chars", 400

                database.edit_sensor(sensor.id, new_name, new_location)
                return "Edits performed", 200
        

    def listen(self, address: str = "127.0.0.1", port: int = 9001, development_mode: bool = False):
        if self.listening:
            raise RuntimeError("Called listen twice!")

        self.listening = True
        self.address = address
        self.port = port

        CORS(self.app, origins=[
            "http://icetea.esinko.net:9000",
            "http://localhost:9000"
        ], supports_credentials=True)

        if not development_mode:
            # NOTE: We need to this trick to make development mode work on Windows
            GunicornApplication = conditionally_declare_GunicornApplication()
            GunicornApplication(self.app, {
                "bind": f"{address}:{port}",
                "workers": 4,
                "daemon": True
            }).run()
        else:
            def _listen():
                self.app.run(host=self.address, port=self.port, debug=False) 

            self.thread = Thread(target=_listen, daemon=True)
            self.thread.start()

        
