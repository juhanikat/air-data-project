from sys import exit, stdout
from signal import signal, SIGINT, SIG_IGN, SIGTERM
from util.context import Context
from util.args import get_app_args

def on_exit(context: Context):
    context.destroy()
    print("Goodbye.")
    exit(0)


def main():
    # Mandatory init
    is_compiled =  "__compiled__" in globals()
    if is_compiled:
        stdout.reconfigure(line_buffering=True) # pyright: ignore[reportAttributeAccessIssue]
    args = get_app_args()
    print(f"Runtime: {"compiled" if is_compiled else "from source"}")

    # Create global app context
    context = Context()
    signal(SIGTERM, lambda _, __: on_exit(context))

    try:
        # MARK: Database
        context.database.set_file(args.get("database") or "../data/main.db")
        print(f"Opening SQLite database from '{context.database.file}'")
        context.database.open()

        # MARK: MQTT
        context.mqtt.register_listeners(context)
        context.mqtt.listen(address=args.get("mqtt_address") or "127.0.0.1",
                            port=args.get("mqtt_port") or 1883,
                            username=args.get("mqtt_user"),
                            password=args.get("mqtt_password"))

        # MARK: API
        context.api.register_routes(context)
        context.api.listen(args.get("api_address") or "127.0.0.1",
                           args.get("api_port") or 8000,
                           args.get("dev") or False)

        # api.listen should occupy the main thread
        # when it returns, we want to be exiting
        # hence this
        on_exit(context)
    except KeyboardInterrupt:
        signal(SIGINT, SIG_IGN)
        on_exit(context)


if __name__ == "__main__":
    main()
