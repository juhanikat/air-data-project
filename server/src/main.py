from sys import exit, stdout
from signal import signal, SIGINT, SIG_IGN, SIGTERM
from util.context import Context
from util.args import get_app_args

def on_exit(context: Context):
    context.destroy()
    print("Goodbye.")

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
        context.database.set_file(args.get("database") or "./main.db")
        print(f"Opening SQLite database from '{context.database.file}'")
        context.database.open()

        # MARK: MQTT
        # TODO

        # MARK: API
        context.api.register_routes(context)
        context.api.listen(args.get("api-address") or "127.0.0.1",
                           args.get("api-port") or 8000,
                           args.get("dev") or False)

    except KeyboardInterrupt:
        signal(SIGINT, SIG_IGN)
        on_exit(context)

if __name__ == "__main__":
    main()
