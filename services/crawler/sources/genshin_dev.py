from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from urllib.parse import urljoin

import requests

from core import HttpConfig, ProgressReporter, create_retrying_session


DEFAULT_ENTITY_TYPES = ("characters", "weapons", "artifacts", "materials", "enemies", "domains")


@dataclass(frozen=True)
class SourceResponse:
    entity_type: str
    source_url: str
    payload: Any


class GenshinDevSource:
    """Fetch static Genshin game data from the hosted genshin.dev JSON API."""

    def __init__(
        self,
        base_url: str,
        lang: str,
        http_config: HttpConfig,
        progress: ProgressReporter | None = None,
    ) -> None:
        self.base_url = base_url.rstrip("/") + "/"
        self.lang = lang
        self.http_config = http_config
        self.session = create_retrying_session(http_config)
        self.progress = progress or ProgressReporter(enabled=False)

    def discover_types(self) -> set[str]:
        self.progress.step("discovering supplemental source entity types")
        response = self._get(self.base_url)
        payload = response.json()
        available_types = set(payload.get("types", []))
        self.progress.step(f"supplemental source entity types found: {len(available_types)}")
        return available_types

    def fetch_all(self, requested_types: list[str], limit: int | None = None) -> list[SourceResponse]:
        available_types = self.discover_types()
        responses: list[SourceResponse] = []
        task = self.progress.task("fetching supplemental entity groups", len(requested_types))

        for entity_type in requested_types:
            if entity_type not in available_types:
                task.advance(f"{entity_type} unavailable")
                continue

            source_url = urljoin(self.base_url, f"{entity_type}/all?lang={self.lang}")
            response = self._get(source_url)
            payload = response.json()
            limited_payload = self._limit_payload(payload, limit)
            responses.append(
                SourceResponse(
                    entity_type=entity_type,
                    source_url=source_url,
                    payload=limited_payload,
                )
            )
            record_count = len(limited_payload) if hasattr(limited_payload, "__len__") else 0
            task.advance(f"{entity_type}: {record_count}")

        task.done()
        return responses

    def _get(self, url: str) -> requests.Response:
        response = self.session.get(url, timeout=self.http_config.timeout_seconds)
        response.raise_for_status()
        return response

    def _limit_payload(self, payload: Any, limit: int | None) -> Any:
        if not limit:
            return payload

        if isinstance(payload, list):
            return payload[:limit]

        if isinstance(payload, dict):
            return dict(list(payload.items())[:limit])

        return payload
