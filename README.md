# Civic

Real-time civic event coordination platform with live participant tracking, alerts, and interactive maps.

## Stack

- **Backend**: Go 1.22, SQLite, Server-Sent Events (SSE)
- **Frontend**: Vue 3, Vite, Pinia, Leaflet maps
- **Deploy**: Single binary (SPA embedded via `go:embed`) → systemd + nginx

## Development

```bash
# Install frontend deps
cd frontend && npm install && cd ..

# Run both (backend :8080, frontend :3000 with API proxy)
make dev
```

## Build

Compiles the Vue SPA into the Go binary:

```bash
make build
# Output: backend/civic-server
```

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/events` | Create event |
| GET | `/api/join/{code}` | Lookup event by join code |
| GET | `/api/events/{id}` | Get event details |
| POST | `/api/events/{id}/join` | Join as participant |
| POST | `/api/events/{id}/checkin` | Check in with location |
| GET | `/api/events/{id}/participants` | List participants |
| POST | `/api/events/{id}/alerts` | Create alert |
| GET | `/api/events/{id}/alerts` | List alerts |
| GET | `/api/events/{id}/stream` | SSE real-time stream |

## Deploy

CI/CD via GitHub Actions on push to `main`. Builds linux/amd64 binary and deploys to VPS.

### First-time VPS setup

```bash
# Copy service file
scp deploy/civic.service root@46.101.104.158:/etc/systemd/system/civic.service

# Run setup (creates /opt/civic, enables service, configures nginx)
ssh root@46.101.104.158 'bash -s' < deploy/setup.sh

# Update domain in nginx config, then:
ssh root@46.101.104.158 "certbot --nginx -d <your-domain>"
```

### Required GitHub Secret

- `VPS_SSH_KEY` — Private SSH key with access to `root@46.101.104.158`

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4444` | HTTP listen port |
| `DB_PATH` | `civic.db` | SQLite database path |
