from invoke.tasks import task

@task
def test(ctx):
    ctx.run("pytest src")

@task
def start(ctx):
    ctx.run(f"cd ./src && poetry run python main.py --dev")

@task
def start_prod(ctx):
    ctx.run(f"cd ./src && poetry run python main.py")

@task
def build(ctx):
    ctx.run(" ".join([
        "nuitka src/main.py",
        "--follow-imports --onefile --output-dir=out/ --output-filename=air-data-server.bin",
        "--lto=yes",
        "--include-data-files=src/util/init.sql=util/init.sql",
        "--include-data-files=src/util/schema.sql=util/schema.sql",
        "--include-package=gunicorn"
    ]))
