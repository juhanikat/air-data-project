# air-data-project
Data Science course project.

### Monorepository structure
Each directory contains a single service.

- Backend: [/server](./server/)
- Frontend: [/web](./web/)
- Broker (Mosquitto): [/mosquitto/config](./mosquitto/config)

### Service ports
- `backend`: `9001`
- `frontend`: `9000`
- `mosquitto`: `9003`

## Setup a development environment

> [!IMPORTANT]  
> **Important Prerequisites/Things to remember**
> - Before following any of these instructions, make sure any existing deployment is not running on your local system! To shutdown everything related to this project, follow instructions under [Proper shutdown](#proper-shutdown).
> - Only run `docker compose` commands from the repository root!
> - If you've made changes in ANY code, configs or environment variables and want to deploy your changes, pass `--build` and `--force-recreate` flags to `docker compose`.
> - Services are demonized, unless you shut them down, they will be automatically restarted even after OS restarts.

### Frontend development
The frontend uses Vite. Follow instructions in [/web/README.md](./web/README.md) to start a development webserver.

Displaying data in the frontend requires the Backend service to be running. Follow [Backend development](#backend-development) setup instructions below.

In order to test production deployment, start the production server with:

```bash
docker compose up frontend
```

### Backend development
> [!IMPORTANT]  
> A functional development deployment requires a functioning Broker service. Complete [Local MQTT broker setup](#local-mqtt-broker-setup) instructions first.

The Backend uses Poetry for project management. Follow instructions in [`/server/README.md#setup-development-environment"](./server/README.md#setup-development-environment) for setup.

### Local MQTT Broker setup
This project uses Mosquitto for MQTT brokering in development and production.

#### Setup

##### Step 1: Build Mosquitto
Build the Mosquitto MQTT broker with:

```bash
docker compose build mosquitto
```

##### Step 2: Configure credentials
Mosquitto needs to provide access to the sensors and the backend server. This repository has default credentials configured in [`/mosquitto/config/password`](./mosquitto/config/passwords). You will need to create your own.

To add your own credentials:
1. Delete the `passwords` ([`/mosquitto/config/password](./mosquitto/config/passwords)) file.
2. Create the `backend` and `sensors` users with the following commands. You will be prompted for the password twice for each user:
    - Create `backend` user: `docker run --rm -it -v ./mosquitto/config:/mosquitto/config eclipse-mosquitto:2 mosquitto_passwd -c /mosquitto/config/passwords backend`
    - Create `sensors` user: `docker run --rm -it -v ./mosquitto/config:/mosquitto/config eclipse-mosquitto:2 mosquitto_passwd /mosquitto/config/passwords sensors`
3. Add `backend` credentials to the project environment. Follow the example format in [`.env.example`](./.env.example) and create the `.env` file in the repository root.

#### Step 3: Start Mosquitto
Start the Mosquitto MQTT broker with:

```bash
docker compose up mosquitto
```

### Proper shutdown
Shutdown all containers and prevent autostart with:

```bash
docker compose down
```

## Deploying to production
This project used Docker Compose for deployment. Each core component (backend, frontend and broker) can be deployed at once with:

```bash
docker compose up
```

Beware that building will take a few minutes depending on your system.

## Updating deployments
In order to keep data collection services online at all times, rebuild specific services instead of all at once.

For example, in order to update the `frontend` deployment, run:

```bash
docker compose up -d --build --force-recreate frontend
```

### License
```
Air Data Server project. MQTT data collection and public serving.
Copyright (C) 2026 Eemil Sinkko, Juhani Kataja & Jaakko Airikkala

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>
```
