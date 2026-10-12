FROM python:3.13-slim-trixie
WORKDIR /app
RUN pip install --no-cache-dir poetry
# TODO: Properly store ccache data outside of container
RUN apt-get update && apt-get install -y patchelf binutils build-essential ccache

# Runtime user
RUN useradd --create-home --uid 10001 appuser \
    && chown -R appuser:appuser /app

# Install dependencies (cache optimal)
# NOTE: Can't include lockfile due to windows issues
# TODO: Add lockfile back
USER appuser
COPY pyproject.toml ./
RUN poetry install --only main --no-root --no-interaction --no-ansi

# Copy app
COPY . .

# Compile
#RUN poetry run invoke build

# Run as user
EXPOSE 9001

#CMD ["./out/air-data-server.bin", "--api-port=9001", "--api-address=0.0.0.0", "--mqtt-address=mosquitto", "--mqtt-port=9003", "--database=./data/main.db"]
CMD ["poetry", "run", "python", "./src/main.py", "--api-port=9001", "--api-address=0.0.0.0", "--mqtt-address=mosquitto", "--mqtt-port=9003", "--database=./data/main.db"]
