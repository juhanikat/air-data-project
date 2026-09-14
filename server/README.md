# Air Data Server

This is the server part of the project. The server consists of:

1. An MQTT client (`server.py`), which listens to the messages published by the Ruuvi gateway.

## Setup

1. Create a virtual environment: `python3 -m venv .venv`
2. Activate it: `source .venv/bin/activate`
3. Install Poetry inside the virtual environment: `pip install poetry`
4. Install packages defined in poetry.lock: `poetry install`
5. Start the server: `poetry run python3 server.py`
