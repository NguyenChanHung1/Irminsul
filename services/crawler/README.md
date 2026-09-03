# Irminsul Crawler

## Folder Structure

```text
services/crawler/
├── crawler.py
├── core.py
├── sources/
├── normalizers/
├── validators/
├── exporters/
└── jobs/
```

## Source Notes

`CrawlJob` uses `NS` as the primary source. The rendered site exposes current-version static JSON under a versioned `/gi/{version}/...` path. The crawler discovers `{version}` from the site HTML, then fetches NS list and detail JSON.

`genshin.dev`, hosted at `https://genshin.jmp.blue`, remains a supplemental source. NS data wins during merging; genshin.dev fills missing fields and still supplies `domains`/dungeons where NS does not currently expose an equivalent top-level dataset.

Useful entity mappings:

- NS `character.json` + `en/character/{id}.json` -> characters
- NS `weapon.json` + `en/weapon/{id}.json` -> weapons
- NS `artifact.json` + `en/artifact/{id}.json` -> artifact sets
- NS `en/item.json` -> item catalog/material references
- NS `monster.json` + `en/monster/{id}.json` -> enemies
- genshin.dev `domains/all?lang=en` -> dungeons/domains

HTML sources such as wiki pages can be useful as secondary references, but we avoid scraping them because the JSON API is easier to normalize, test, and diff.

## Environment

- `CRAWLER_JOB`: `crawl_job` or `raw`.
- `NS_SITE_URL`: rendered site URL used for version discovery.
- `NS_STATIC_BASE_URL`: static CDN base URL.
- `NS_ENTITY_TYPES`: comma-separated NS entity types.
- `GENSHIN_DEV_BASE_URL`: supplemental API base URL, default `https://genshin.jmp.blue`.
- `CRAWLER_LANG`: response language, default `en`.
- `CRAWLER_ENTITY_TYPES`: comma-separated upstream entity types.
- `CRAWLER_ENTITY_LIMIT`: optional sample limit per entity type.
- `CRAWLER_OUTPUT_DIR`: dataset root directory. The crawler creates it if missing.
- `CRAWLER_FAIL_ON_VALIDATION`: set `true` to fail if normalized records have missing IDs/names.
- `CRAWLER_TIMEOUT_SECONDS`: request timeout.
- `CRAWLER_RETRY_TOTAL`: retry count.
- `CRAWLER_RETRY_BACKOFF_SECONDS`: retry backoff base.
- `CRAWLER_LOG_LEVEL`: Python logging level.
- `CRAWLER_USER_AGENT`: user agent sent to the source.

## Run

From the repo root:

```bash
npm run dev:crawler
```

For a small sample:

```bash
CRAWLER_ENTITY_LIMIT=2 python crawler.py
```

For a root dataset directory:

```bash
CRAWL_DATASET_PATH=/data/gi-data npm run crawl:dataset
```

## CrawlJob Output Shape

The crawler writes a directory dataset:

```text
/data/gi-data/
├── metadata.json
├── characters/raw.json
├── weapons/raw.json
├── artifacts/raw.json
├── ascension_materials/raw.json
├── enemies/raw.json
├── dungeons/raw.json
├── gi-crawl-job.json
└── {timestamp}-game-data-crawl-job.json
```

Each `{entity}/raw.json` stores:

```json
{
  "data": []
}
```

The combined `gi-crawl-job.json` keeps the legacy shape:

```json
{
  "metadata": {
    "job": "crawl_job_game_data_import",
    "source": "NS static API primary with genshin.dev supplemental data",
    "primary_source": "NS",
    "supplemental_source": "genshin.dev hosted API",
    "source_versions": {
      "ns": "6.6.52"
    },
    "language": "en",
    "counts": {
      "characters": 2,
      "weapons": 2,
      "artifacts": 2,
      "ascension_materials": 20,
      "enemies": 2,
      "dungeons": 2
    },
    "validation_issues": []
  },
  "data": {
    "characters": [],
    "weapons": [],
    "artifacts": [],
    "ascension_materials": [],
    "enemies": [],
    "dungeons": []
  }
}
```

Normalized records do not include raw source blobs. Fields are mapped directly into the output contract so the database import can insert relational columns and JSON substructures intentionally.
