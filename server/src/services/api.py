from flask import Flask
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
    port: int
    listening: bool = False

    def __init__(self):
        self.app = Flask(__name__)


    def register_routes(self, context: Context):
        # MARK: /latest
        # Get all latest measurements
        @self.app.route("/api/v1/latest")
        def latest():
            return "TODO"

        # MARK: /query
        # Query historical data
        @self.app.route("/api/v1/query")
        def query():
            return "TODO"

        # MARK: /list
        # Get list of sensors
        @self.app.route("/api/v1/list")
        def list():
            return "TODO"


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
