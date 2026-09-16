from invoke import task

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
    ctx.run(f"nuitka src/main.py --follow-imports --onefile --output-dir=out/ --output-filename=air-data-server.bin --lto=yes")
