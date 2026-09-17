# Air Data Server

This is the server/backend part of the project. It consists of services and utilities.

The services are the main components of the program. You can find them in [./src/services](./src/services/). At this time, these are the main services:
- [api](./src/services/api.py), which provides a REST API created with Flask for the frontend to access data and login. When in production Gunicorn will be automatically used instead of Flask.
- [database](./src/services/database.py), which contains abstract SQLite database methods used across the app
- [mqtt](./src/services/mqtt.py), which uses a special Paho MQTT client wrapper from utils to listen to Ruuvi sensor message topics. This is the concrete component that records sensor data.

The main method of the program is in [main.py](./src/main.py) and is executed by default when this file is ran by Python.

The utilities used by various parts of the program live in the [util](./src/util/) folder. These utils include, but are not limited to, the Paho MQTT client wrapper, the command-line argument parser and a wrapper for the `sqlite3` Python standard library designed for fault tolerance. Additionally you can find the database [schema.sql](./src/util/schema.sql) and [init.sql](./src/util/init.sql) from the [util](./src/util/) folder.

## Data Storage
All persistent data is stored in the [data](./data/) folder, which will be mounted to the backend service container directly. The database is called `main.db` by default.

## Setup
Python `3.10` or newer is required.

1. Create a virtual environment: `python3 -m venv .venv`
2. Activate it: `source .venv/bin/activate`
3. Install Poetry inside the virtual environment: `pip install poetry`
4. Install packages defined in poetry.lock: `poetry install`
5. Start the server: `poetry run invoke start`

## Compiling
At this time, only Linux is supported as the target platform. This limitation stems from the WYSIWYG webserver choice (Gunicorn) for API production use. 

1. Make sure steps outlined in [setup](#setup) have been completed
2. Make sure you have `binutils` and `build-essential` installed. Consider installing the `ccache` to optimize compile time
3. Run the Nuitka compiler: `poetry run invoke build`
4. Find the output binary in `out/`
