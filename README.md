# Irminsul

Irminsul is a monorepo for crawling game data, exposing it through a NestJS API, and displaying it in a Next.js web app.

## Project Structure

```text
apps/client      Next.js frontend
apps/api         NestJS API
services/crawler Python crawler and normalizers
prisma           Root Prisma schema and migrations
docker-compose.yml
```

## Prerequisites

- Node.js 20+
- npm
- Python 3.10+
- Docker and Docker Compose

Install Python crawler dependencies if you run the crawler directly:

```bash
python -m pip install -r services/crawler/requirements.txt
```

## Environment

Create your local `.env` from the example:

```bash
cp .env.example .env
```

For local development, these are the important values:

```env
DATABASE_URL=
PG_DB=irminsul_db
PG_USER=nahida
PG_PASSWORD=nahida
PGADMIN_PORT=5051
NEXT_PUBLIC_API_URL=

NS_SITE_URL=
NS_BASE_URL=
GENSHIN_DEV_BASE_URL=
CRAWLER_OUTPUT_DIR=data/raw
CRAWL_DATASET_PATH=data/raw
```

The API loads the root `.env`. When running the API locally outside Docker, it automatically maps the Docker hostname `db` to `127.0.0.1:5432`. Inside Docker, provide `DATABASE_URL` directly to the container.

## Quick Start

Install JavaScript dependencies:

```bash
npm install
```

Start Postgres and pgAdmin:

```bash
docker compose up -d db pgadmin
```

Generate Prisma Client and apply migrations:

```bash
npm run db:generate
npm run db:migrate
```

Crawl and import the dataset:

```bash
npm run crawl:dataset
```

Start the API and web app:

```bash
npm run dev
```

## Common Development Workflow

Start only the database:

```bash
docker compose up -d db pgadmin
```

Run API only:

```bash
npm run dev:backend
```

Run frontend only:

```bash
npm run dev:frontend
```

Run both API and frontend:

```bash
npm run dev
```

Validate Prisma schema:

```bash
npm run db:validate
```

Regenerate Prisma Client:

```bash
npm run db:generate
```

Apply migrations:

```bash
npm run db:migrate
```

Create a development migration:

```bash
npm run db:migrate:dev -- migration_name
```

## Crawler and Import

The crawler writes a directory dataset. The importer reads that dataset and upserts records into Postgres.

Run the full crawl-and-import pipeline:

```bash
npm run crawl:dataset
```

Use a custom dataset path:

```bash
npm run crawl:dataset -- /tmp/irminsul-data
```

Run crawler only:

```bash
npm run crawl:job
```

Import an existing dataset only:

```bash
npm run crawl:import -- /tmp/irminsul-data
```

Run a smaller crawler sample:

```bash
CRAWLER_ENTITY_LIMIT=2 CRAWLER_OUTPUT_DIR=/tmp/irminsul-sample npm run crawl:job
```

Expected dataset shape:

```text
data/raw/
├── metadata.json
├── characters/raw.json
├── weapons/raw.json
├── artifacts/raw.json
├── ascension_materials/raw.json
├── enemies/raw.json
├── dungeons/raw.json
└── gi-crawl-job.json
```

## API

Useful routes:

```text
GET /api/characters
GET /api/characters/:id
GET /api/weapons
GET /api/weapons/:id
GET /api/artifacts
GET /api/materials
GET /api/enemies
GET /api/dungeons
```

List routes support query params such as:

```text
q=search text
page=1
limit=40
rarity=5
element=Pyro
weaponType=Sword
type=Enemy Drops
```

Example:

```bash
curl -s "http://localhost:3001/api/characters?q=Sandrone&limit=5"
```

## Web App

The web app runs on `http://localhost:3000`.

Main database pages:

- `/characters`
- `/weapons`
- `/artifacts`
- `/items`
- `/enemies`

The frontend reads the API base URL from:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Docker Notes

`docker-compose.yml` currently starts Postgres and pgAdmin by default. The API, web app, and crawler service definitions are present as commented examples. For day-to-day development, run Postgres with Docker and run the API/frontend with npm.

If you uncomment and run the API container, use Docker networking:

```env
DATABASE_URL=postgres://nahida:nahida@db:5432/irminsul_db
```

If you run the API locally on your host machine, use the normal `.env` shown above or:

```env
DATABASE_URL=postgres://nahida:nahida@127.0.0.1:5432/irminsul_db
```

## Troubleshooting

If Prisma cannot find models after dependency changes:

```bash
npm run db:generate
```

If the API cannot reach Postgres, make sure the database container is running:

```bash
docker compose up -d db
docker ps
```

If the frontend loads but lists stay empty, verify the API directly:

```bash
curl -s "http://localhost:3001/api/characters?limit=2"
```

If image URLs fail in the frontend, check `apps/client/next.config.js` for the allowed remote image host.
