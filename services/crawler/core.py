from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Any

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class JsonLogFormatter(logging.Formatter):
    """Format logs as JSON so Docker, CI, and future schedulers can parse them."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": utc_now(),
            "level": record.levelname.lower(),
            "message": record.getMessage(),
        }

        extra = getattr(record, "extra", None)
        if isinstance(extra, dict):
            payload.update(extra)

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload, ensure_ascii=False)


def build_logger() -> logging.Logger:
    logger = logging.getLogger("irminsul.crawler")
    logger.setLevel(os.getenv("CRAWLER_LOG_LEVEL", "INFO").upper())
    logger.handlers.clear()

    handler = logging.StreamHandler()
    handler.setFormatter(JsonLogFormatter())
    logger.addHandler(handler)
    logger.propagate = False
    return logger


@dataclass(frozen=True)
class HttpConfig:
    timeout_seconds: float
    retry_total: int
    retry_backoff_seconds: float
    user_agent: str

    @classmethod
    def from_env(cls) -> "HttpConfig":
        return cls(
            timeout_seconds=float(os.getenv("CRAWLER_TIMEOUT_SECONDS", "15")),
            retry_total=int(os.getenv("CRAWLER_RETRY_TOTAL", "3")),
            retry_backoff_seconds=float(os.getenv("CRAWLER_RETRY_BACKOFF_SECONDS", "0.5")),
            user_agent=os.getenv("CRAWLER_USER_AGENT", "IrminsulCrawler/0.2"),
        )


def create_retrying_session(config: HttpConfig) -> requests.Session:
    retry_policy = Retry(
        total=config.retry_total,
        connect=config.retry_total,
        read=config.retry_total,
        status=config.retry_total,
        backoff_factor=config.retry_backoff_seconds,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=("GET",),
        raise_on_status=False,
    )

    adapter = HTTPAdapter(max_retries=retry_policy)
    session = requests.Session()
    session.headers.update({"User-Agent": config.user_agent})
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session


def write_json_atomically(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

    # The temp-file swap prevents half-written JSON if the process exits mid-write.
    with NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as temp_file:
        json.dump(payload, temp_file, ensure_ascii=False, indent=2)
        temp_file.write("\n")
        temp_path = Path(temp_file.name)

    temp_path.replace(path)
