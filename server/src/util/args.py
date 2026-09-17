from argparse import ArgumentParser
from sys import exit
from os import environ

def get_app_args():
    arg_parser = ArgumentParser()
    arg_parser.add_argument("--dev", action="store_true", help="Run in development mode")
    arg_parser.add_argument("--database", type=str, help="Set the path of the SQLite database")
    arg_parser.add_argument("--mqtt-port", type=int, help="Set the MQTT server port")
    arg_parser.add_argument("--mqtt-address", type=str, help="Set the MQTT server address")
    arg_parser.add_argument("--api-port", type=int, help="Set the frontend server port")
    arg_parser.add_argument("--api-address", type=str, help="Set the frontend server address")
    arg_parser.add_argument("--mqtt-user", type=str, help="Backend MQTT client username", default=None)
    arg_parser.add_argument("--mqtt-password", type=str, help="Backend MQTT client password", default=None)

    args, unknown = arg_parser.parse_known_args()
    if unknown:
        print(f"Unknown commandline arguments: {unknown}")
        arg_parser.print_help()
        exit(1)

    arglist = vars(args)

    # Fill environment support vars
    if not arglist.get("mqtt_user") and "BACKEND_MQTT_USER" in environ:
        arglist["mqtt_user"] = environ["BACKEND_MQTT_USER"]
    if not arglist.get("mqtt_password") and "BACKEND_MQTT_PASSWORD" in environ:
        arglist["mqtt_password"] = environ["BACKEND_MQTT_PASSWORD"]

    return arglist
