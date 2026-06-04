# Irminsul

This repository is scaffolded as a monorepo containing:

- `apps/client`: Next.js frontend
- `apps/api`: NestJS backend with Prisma
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

- Client: `http://localhost:3000`
- API: `http://localhost:3001`

## Prisma

From `apps/api`:

```bash
cd apps/api
npm install
npm run prisma:generate
npm run prisma:migrate
```

## Local development without Docker

- Client: `npm run dev:client`
- API: `npm run dev:api`
- Crawler: `npm run dev:crawler`

## Python crawler

The crawler service is located in `services/crawler` and can be run standalone.
