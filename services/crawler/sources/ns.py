from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any
from urllib.parse import urljoin

import requests

from core import HttpConfig, create_retrying_session


DEFAULT_NS_ENTITY_TYPES = ("characters", "weapons", "artifacts", "materials", "enemies")


@dataclass(frozen=True)
class NSResponse:
    entity_type: str
    source_url: str
    payload: Any


class NSSource:
    """Fetch current Genshin static data from the NS static dataset."""

    def __init__(self, site_url: str, static_base_url: str, lang: str, http_config: HttpConfig) -> None:
        self.site_url = site_url.rstrip("/") + "/"
        self.static_base_url = static_base_url.rstrip("/") + "/"
        self.lang = lang
        self.http_config = http_config
        self.session = create_retrying_session(http_config)

    def discover_version(self) -> str:
        response = self._get(self.site_url)
        escaped_host = re.escape(self.static_base_url.rstrip("/"))
        match = re.search(rf"{escaped_host}/gi/([^/]+)/character\.json", response.text)
        if not match:
            raise ValueError("Could not discover NS GI version from site HTML.")
        return match.group(1)

    def fetch_all(self, requested_types: list[str], limit: int | None = None) -> tuple[str, list[NSResponse]]:
        version = self.discover_version()
        responses: list[NSResponse] = []

        for entity_type in requested_types:
            if entity_type == "characters":
                responses.append(self._fetch_with_details(version, entity_type, "character.json", "character", limit))
            elif entity_type == "weapons":
                responses.append(self._fetch_with_details(version, entity_type, "weapon.json", "weapon", limit))
            elif entity_type == "artifacts":
                responses.append(self._fetch_with_details(version, entity_type, "artifact.json", "artifact", limit))
            elif entity_type == "materials":
                responses.append(self._fetch_simple(version, entity_type, f"{self.lang}/item_all.json", limit))
            elif entity_type == "enemies":
                responses.append(self._fetch_with_details(version, entity_type, "monster.json", "monster", limit))

        return version, responses

    def _fetch_simple(self, version: str, entity_type: str, path: str, limit: int | None) -> NSResponse:
        source_url = self._static_url(version, path)
        payload = self._get(source_url).json()
        return NSResponse(entity_type, source_url, self._limit_mapping(payload, limit))

    def _fetch_with_details(
        self,
        version: str,
        entity_type: str,
        list_path: str,
        detail_folder: str,
        limit: int | None,
    ) -> NSResponse:
        source_url = self._static_url(version, list_path)
        listing = self._limit_mapping(self._get(source_url).json(), limit)
        details: dict[str, Any] = {}

        for item_id in listing:
            detail_url = self._static_url(version, f"{self.lang}/{detail_folder}/{item_id}.json")
            try:
                details[item_id] = self._get(detail_url).json()
            except requests.HTTPError:
                details[item_id] = None

        return NSResponse(
            entity_type=entity_type,
            source_url=source_url,
            payload={"list": listing, "details": details},
        )

    def _static_url(self, version: str, path: str) -> str:
        return urljoin(self.static_base_url, f"gi/{version}/{path}")

    def _get(self, url: str) -> requests.Response:
        response = self.session.get(url, timeout=self.http_config.timeout_seconds)
        response.raise_for_status()
        return response

    def _limit_mapping(self, payload: Any, limit: int | None) -> Any:
        if not limit or not isinstance(payload, dict):
            return payload
        return dict(list(payload.items())[:limit])
