from __future__ import annotations

import os
import re
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from dotenv import load_dotenv

from core import HttpConfig, build_logger, create_retrying_session, utc_now, write_json_atomically
from jobs import run_crawl_job


load_dotenv()


@dataclass(frozen=True)
class RawCrawlerConfig:
    """Raw crawl config. Kept as a separate job for source smoke tests."""

    crawl_url: str
    output_dir: Path

    @classmethod
    def from_env(cls) -> "RawCrawlerConfig":
        return cls(
            crawl_url=os.getenv("CRAWL_URL", "https://example.com"),
            output_dir=Path(os.getenv("CRAWLER_OUTPUT_DIR", "data/raw")),
        )


def build_raw_output_path(output_dir: Path, source_url: str) -> Path:
    parsed = urlparse(source_url)
    source_name = parsed.netloc or "local-source"
    safe_source = re.sub(r"[^a-zA-Z0-9._-]+", "-", source_name).strip("-").lower()
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    return output_dir / f"{timestamp}-{safe_source}.json"


def run_raw_crawl() -> Path:
    logger = build_logger()
    config = RawCrawlerConfig.from_env()
    http_config = HttpConfig.from_env()
    session = create_retrying_session(http_config)

    logger.info(
        "raw_crawl_started",
        extra={"extra": {"config": {**asdict(config), "output_dir": str(config.output_dir)}}},
    )

    response = session.get(config.crawl_url, timeout=http_config.timeout_seconds)
    response.raise_for_status()

    payload: dict[str, Any] = {
        "source_url": config.crawl_url,
        "fetched_at": utc_now(),
        "status_code": response.status_code,
        "content_type": response.headers.get("content-type", ""),
        "encoding": response.encoding,
        "body": response.text,
    }

    output_path = build_raw_output_path(config.output_dir, config.crawl_url)
    write_json_atomically(output_path, payload)
    logger.info("raw_crawl_saved", extra={"extra": {"output_path": str(output_path)}})
    return output_path


def run() -> Path:
    job = os.getenv("CRAWLER_JOB", "crawl_job").strip().lower()
    if job == "raw":
        return run_raw_crawl()
    if job == "crawl_job":
        return run_crawl_job()
    raise ValueError(f"Unknown CRAWLER_JOB={job!r}. Use 'raw' or 'crawl_job'.")


if __name__ == "__main__":
    try:
        run()
    except Exception:
        build_logger().exception("crawler_failed")
        raise
