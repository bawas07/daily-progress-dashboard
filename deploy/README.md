# Production Deployment

## Containers

- `backend`: Bun + Hono API (`repos/backend/Dockerfile`)
- `frontend`: Vue static bundle served by Nginx (`repos/frontend/Dockerfile`)
- `reverse-proxy`: Edge Nginx routing `/` to frontend and `/api` to backend
- `postgres`: PostgreSQL 16
- `prometheus`: Scrapes `/metrics` and proxy health endpoint

## Run

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

## Environment

- Copy `repos/backend/.env.production.example` to your secret management system.
- Copy `repos/frontend/.env.production.example` for frontend runtime build variables.

## SSL

- Default config is `deploy/nginx/reverse-proxy.conf` (HTTP).
- SSL-ready example config is `deploy/nginx/reverse-proxy.ssl.example.conf`.
- Mount your certificates under `deploy/ssl/` as:
  - `deploy/ssl/fullchain.pem`
  - `deploy/ssl/privkey.pem`

## Health and Monitoring

- Backend health: `GET /health`
- Backend metrics: `GET /metrics` (Prometheus exposition format)
- Proxy health: `GET /healthz`
- Prometheus UI: `http://localhost:9090`

