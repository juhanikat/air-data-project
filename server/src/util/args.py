from argparse import ArgumentParser
from sys import exit

def get_app_args():
    arg_parser = ArgumentParser()
    arg_parser.add_argument("--dev", action="store_true", help="Run in development mode")
    arg_parser.add_argument("--database", type=str, help="Set the path of the SQLite database")
    arg_parser.add_argument("--mqtt-port", type=int, help="Set the MQTT server port")
    arg_parser.add_argument("--mqtt-address", type=str, help="Set the MQTT server address")
    arg_parser.add_argument("--web-port", type=int, help="Set the frontend server port")
    arg_parser.add_argument("--web-address", type=str, help="Set the frontend server address")

    args, unknown = arg_parser.parse_known_args()
    if unknown:
        print(f"Unknown commandline arguments: {unknown}")
        arg_parser.print_help()
        exit(1)

    return vars(args)
