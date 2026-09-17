# Air Data Server

This is the server part of the project. The server consists of:

1. An MQTT client (`server.py`), which listens to the messages published by the Ruuvi gateway.

## Setup

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
