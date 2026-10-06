from shlex import split
from util.context import Context

def execute(command, context: Context):
    match command:
        case ["create-user", name, password]:
            print(f"Creating user '{name}'")
            with context.database.from_thread() as database:
                try:
                    database.create_user(name, password)
                    print("User created!")
                except Exception as e:
                    print(f"Failed to create user: {e}")

        case ["reset-password", name]:
            print(f"Resetting password of '{name}'")
            with context.database.from_thread() as database:
                try:
                    new_password = database.reset_password(name)
                    print("User password reset to:", new_password)
                except Exception as e:
                    print(f"Failed to edit user: {e}")

        case ["list-users"]:
            with context.database.from_thread() as database:
                users = database.list_users()
                print(f"Users ({len(users)}):")
                for user in database.list_users():
                    print(f"- '{user.name}'")

        case ["help"]:
            print("Command list:\n" + "\n".join([
                "$ create-user [NAME] [PASSWORD]",
                "Create a new user for the frontend.",
                "",
                "$ reset-password [NAME]",
                "Reset the password of a user.",
                "",
                "$ list-users",
                "List existing users by name."
            ]))

        case _:
            print("Unknown command. Use 'help' to see a list of commands.")

    return True


def cli(context: Context):
    while True:
        try:
            line = input("> ")
        except EOFError:
            print("STDIN is required!")
            return

        try:
            command = split(line)
        except ValueError as e:
            print(f"Invalid command: {e}")
            continue

        if command and not execute(command, context):
            break
