# Irminsul

This repository is scaffolded as a monorepo containing:

- `apps/frontend`: Next.js frontend
- `apps/backend`: NestJS backend with Prisma
- `services/crawler`: Python web crawler service
- `docker-compose.yml`: service orchestration for local development

## Quick start

1. Install dependencies

```bash
npm install
```

2. Start the full stack with Docker

```bash
docker compose up --build
```

3. Open services

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

## Prisma

From `apps/backend`:

```bash
cd apps/backend
npm install
npm run prisma:generate
npm run prisma:migrate
```

## Local development without Docker

- Frontend: `npm run dev:frontend`
- Backend: `npm run dev:backend`
- Crawler: `npm run dev:crawler`

## Python crawler

The crawler service is located in `services/crawler` and can be run standalone.
