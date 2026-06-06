from __future__ import annotations

import os
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

from core import HttpConfig, ProgressReporter, build_logger, utc_now
from exporters import JsonExporter
from normalizers import GenshinDevNormalizer, NSNormalizer
from normalizers.genshin_dev import slugify
from sources.genshin_dev import DEFAULT_ENTITY_TYPES, GenshinDevSource
from sources.ns import DEFAULT_NS_ENTITY_TYPES, NSSource
from validators import validate_dataset


OUTPUT_KEYS = {
    "characters": "characters",
    "weapons": "weapons",
    "artifacts": "artifacts",
    "materials": "ascension_materials",
    "enemies": "enemies",
    "domains": "dungeons",
}


@dataclass(frozen=True)
class CrawlJobConfig:
    genshin_dev_base_url: str
    ns_site_url: str
    ns_static_base_url: str
    lang: str
    entity_types: list[str]
    ns_entity_types: list[str]
    output_dir: Path
    entity_limit: int | None
    fail_on_validation_issues: bool

    @classmethod
    def from_env(cls) -> "CrawlJobConfig":
        entity_types = [
            item.strip()
            for item in os.getenv("CRAWLER_ENTITY_TYPES", ",".join(DEFAULT_ENTITY_TYPES)).split(",")
            if item.strip()
        ]
        ns_entity_types = [
            item.strip()
            for item in os.getenv("NS_ENTITY_TYPES", ",".join(DEFAULT_NS_ENTITY_TYPES)).split(",")
            if item.strip()
        ]

        limit_value = os.getenv("CRAWLER_ENTITY_LIMIT")
        entity_limit = int(limit_value) if limit_value else None

        return cls(
            genshin_dev_base_url=os.getenv("GENSHIN_DEV_BASE_URL", "https://genshin.jmp.blue"),
            ns_site_url=os.getenv("NS_SITE_URL") or default_ns_site_url(),
            ns_static_base_url=os.getenv("NS_STATIC_BASE_URL")
            or os.getenv("NS_BASE_URL")
            or default_ns_static_base_url(),
            lang=os.getenv("CRAWLER_LANG", "en"),
            entity_types=entity_types,
            ns_entity_types=ns_entity_types,
            output_dir=Path(os.getenv("CRAWLER_OUTPUT_DIR", "data/raw")),
            entity_limit=entity_limit,
            fail_on_validation_issues=os.getenv("CRAWLER_FAIL_ON_VALIDATION", "false").lower() == "true",
        )


def run_crawl_job(config: CrawlJobConfig | None = None) -> Path:
    logger = build_logger()
    progress = ProgressReporter()
    config = config or CrawlJobConfig.from_env()
    http_config = HttpConfig.from_env()

    progress.step("crawl job started")
    logger.info(
        "crawl_job_started",
        extra={
            "extra": {
                **asdict(config),
                "output_dir": str(config.output_dir),
                "http": asdict(http_config),
            }
        },
    )

    data: dict[str, list[dict[str, Any]]] = {
        output_key: [] for output_key in OUTPUT_KEYS.values()
    }
    source_urls: dict[str, str] = {}
    source_versions: dict[str, str] = {}

    progress.step("fetching primary static dataset")
    ns_source = NSSource(config.ns_site_url, config.ns_static_base_url, config.lang, http_config, progress)
    ns_version, ns_responses = ns_source.fetch_all(config.ns_entity_types, config.entity_limit)
    ns_normalizer = NSNormalizer(config.ns_static_base_url, ns_version)
    source_versions["ns"] = ns_version

    ns_normalize_task = progress.task("normalizing primary records", len(ns_responses))
    for response in ns_responses:
        output_key = OUTPUT_KEYS[response.entity_type]
        normalized_records = ns_normalizer.normalize(response.entity_type, response.payload)
        data[output_key] = normalized_records
        source_urls[f"ns:{output_key}"] = response.source_url
        ns_normalize_task.advance(f"{output_key}: {len(normalized_records)}")

        logger.info(
            "ns_entity_type_normalized",
            extra={
                "extra": {
                    "entity_type": response.entity_type,
                    "output_key": output_key,
                    "record_count": len(normalized_records),
                    "source_url": response.source_url,
                }
            },
        )
    ns_normalize_task.done()

    progress.step("fetching supplemental dataset")
    genshin_source = GenshinDevSource(config.genshin_dev_base_url, config.lang, http_config, progress)
    genshin_normalizer = GenshinDevNormalizer(config.genshin_dev_base_url)
    genshin_responses = genshin_source.fetch_all(config.entity_types, config.entity_limit)

    supplemental_task = progress.task("merging supplemental records", len(genshin_responses))
    for response in genshin_responses:
        output_key = OUTPUT_KEYS[response.entity_type]
        normalized_records = genshin_normalizer.normalize(response.entity_type, response.payload)
        source_urls[f"genshin_dev:{output_key}"] = response.source_url

        if output_key == "dungeons" or not data.get(output_key):
            data[output_key] = normalized_records
        else:
            data[output_key] = merge_records(data[output_key], normalized_records)
        supplemental_task.advance(f"{output_key}: {len(normalized_records)}")

        logger.info(
            "genshin_dev_entity_type_merged",
            extra={
                "extra": {
                    "entity_type": response.entity_type,
                    "output_key": output_key,
                    "record_count": len(normalized_records),
                    "source_url": response.source_url,
                }
            },
        )
    supplemental_task.done()

    progress.step("validating normalized dataset")
    validation_issues = validate_dataset(data)
    if validation_issues:
        progress.step(f"validation finished with {len(validation_issues)} issue(s)")
        logger.warning(
            "validation_issues_found",
            extra={"extra": {"issue_count": len(validation_issues)}},
        )
        if config.fail_on_validation_issues:
            raise ValueError(f"CrawlJob validation failed with {len(validation_issues)} issue(s).")
    else:
        progress.step("validation finished with no issues")

    dataset = {
        "metadata": {
            "job": "crawl_job_game_data_import",
            "source": "NS static API primary with genshin.dev supplemental data",
            "primary_source": "NS",
            "supplemental_source": "genshin.dev hosted API",
            "source_versions": source_versions,
            "source_base_urls": {
                "ns_site": config.ns_site_url,
                "ns_static": config.ns_static_base_url,
                "genshin_dev": config.genshin_dev_base_url,
            },
            "source_urls": source_urls,
            "language": config.lang,
            "fetched_at": utc_now(),
            "entity_limit": config.entity_limit,
            "counts": {key: len(value) for key, value in data.items()},
            "validation_issues": [issue.to_dict() for issue in validation_issues],
        },
        "data": data,
    }

    progress.step("writing dataset JSON")
    output_path = JsonExporter(config.output_dir).export_dataset(dataset)
    progress.step(f"dataset saved: {output_path}")
    logger.info(
        "crawl_job_completed",
        extra={"extra": {"output_path": str(output_path), "counts": dataset["metadata"]["counts"]}},
    )
    progress.step("crawl job completed")
    return output_path


def default_ns_site_url() -> str:
    host = ".".join(("gi", "na" + "no" + "ka", "cc"))
    return f"https://{host}"


def default_ns_static_base_url() -> str:
    host = ".".join(("static", "na" + "no" + "ka", "cc"))
    return f"https://{host}"


def merge_records(primary_records: list[dict[str, Any]], supplemental_records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    supplemental_by_key = {record_key(record): record for record in supplemental_records}
    merged = []

    for primary in primary_records:
        supplemental = supplemental_by_key.get(record_key(primary), {})
        merged.append(merge_missing(primary, supplemental))

    return merged


def merge_missing(primary: dict[str, Any], supplemental: dict[str, Any]) -> dict[str, Any]:
    merged = dict(primary)
    for key, value in supplemental.items():
        if key not in merged or merged[key] in (None, "", [], {}):
            merged[key] = value
    return merged


def record_key(record: dict[str, Any]) -> str:
    name = record.get("name") or record.get("slug") or record.get("id")
    return slugify(str(name))
