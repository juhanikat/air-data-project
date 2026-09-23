# air-data-project
Data Science course project.

### Monorepository structure
- Backend: [/server](./server/)
- Frontend: [/web](./web/)
- Mosquitto config: [/mosquitto/config](./mosquitto/config)

### Deploying with Docker
All 3 components can be deployed at once with Docker Compose.

1. Create mqtt user and password with or re-use the basic credentials in the repo (users: `sensors` and `backend`):
```bash
docker run --rm -it \
  -v ./mosquitto/config:/mosquitto/config \
  eclipse-mosquitto:2 \
  mosquitto_passwd -c /mosquitto/config/passwords myuser
```

*Remove the `-c` to add a second user.*

*Delete the file to remove old users before adding new ones, if you want.*

2. Add the username and password for the backend user to `.env` (create it yourself, see `.env.example`)

2. Start everything with `docker compose up`

#### Service ports
- `backend`: `9001`
- `frontend`: `9000`
- `mosquitto`: `9003`

#### Updating service components
In order to keep data collection services online at all times, rebuild specific services instead of all at once.

For example, in order to update the frontend deployment, run:

```bash
docker compose up -d --build --force-recreate frontend
```

### Authors
TBA

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
