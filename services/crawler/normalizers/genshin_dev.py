from __future__ import annotations

import re
from typing import Any


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"['’]", "", value)
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def as_list(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        items: list[dict[str, Any]] = []
        for item in payload:
            if isinstance(item, dict):
                items.append(item)
        return items

    if isinstance(payload, dict):
        return [value for value in payload.values() if isinstance(value, dict)]

    return []


def source_image_url(base_url: str, entity_type: str, item_id: str, image_type: str = "icon") -> str:
    return f"{base_url.rstrip('/')}/{entity_type}/{item_id}/{image_type}"


class GenshinDevNormalizer:
    """Convert genshin.dev payloads into database-planning records."""

    def __init__(self, base_url: str) -> None:
        self.base_url = base_url

    def normalize(self, entity_type: str, payload: Any) -> list[dict[str, Any]]:
        match entity_type:
            case "characters":
                return [self.character(item) for item in as_list(payload)]
            case "weapons":
                return [self.weapon(item) for item in as_list(payload)]
            case "artifacts":
                return [self.artifact(item) for item in as_list(payload)]
            case "materials":
                return self.materials(payload)
            case "enemies":
                return [self.enemy(item) for item in as_list(payload)]
            case "domains":
                return [self.domain(item) for item in as_list(payload)]
            case _:
                return []

    def character(self, item: dict[str, Any]) -> dict[str, Any]:
        item_id = str(item.get("id") or slugify(str(item.get("name", ""))))
        return {
            "id": item_id,
            "slug": slugify(str(item.get("name") or item_id)),
            "name": item.get("name"),
            "rarity": item.get("rarity"),
            "element": item.get("vision") or item.get("vision_key"),
            "weapon_type": item.get("weapon") or item.get("weapon_type"),
            "nation": item.get("nation"),
            "affiliation": item.get("affiliation"),
            "release_date": item.get("release"),
            "birthday": item.get("birthday"),
            "constellation": item.get("constellation"),
            "icon_url": source_image_url(self.base_url, "characters", item_id),
            "ascension_materials": item.get("ascension_materials", {}),
            "talents": item.get("skillTalents", []),
            "passive_talents": item.get("passiveTalents", []),
            "constellations": item.get("constellations", []),
        }

    def weapon(self, item: dict[str, Any]) -> dict[str, Any]:
        item_id = str(item.get("id") or slugify(str(item.get("name", ""))))
        return {
            "id": item_id,
            "slug": slugify(str(item.get("name") or item_id)),
            "name": item.get("name"),
            "rarity": item.get("rarity"),
            "weapon_type": item.get("type"),
            "base_attack": item.get("baseAttack"),
            "sub_stat": item.get("subStat"),
            "passive_name": item.get("passiveName"),
            "passive_description": item.get("passiveDesc"),
            "location": item.get("location"),
            "ascension_material_group": item.get("ascensionMaterial"),
            "icon_url": source_image_url(self.base_url, "weapons", item_id),
        }

    def artifact(self, item: dict[str, Any]) -> dict[str, Any]:
        item_id = str(item.get("id") or slugify(str(item.get("name", ""))))
        return {
            "id": item_id,
            "slug": slugify(str(item.get("name") or item_id)),
            "name": item.get("name"),
            "max_rarity": item.get("max_rarity") or item.get("maxRarity"),
            "two_piece_bonus": item.get("2-piece_bonus") or item.get("twoPieceBonus"),
            "four_piece_bonus": item.get("4-piece_bonus") or item.get("fourPieceBonus"),
            "icon_url": source_image_url(self.base_url, "artifacts", item_id),
        }

    def materials(self, payload: Any) -> list[dict[str, Any]]:
        records: list[dict[str, Any]] = []

        for group in as_list(payload):
            group_id = str(group.get("id") or "unknown-material-group")
            for key, value in group.items():
                if key == "id":
                    continue

                records.extend(self._flatten_material_value(group_id, key, value))

        return records

    def _flatten_material_value(self, group_id: str, key: str, value: Any) -> list[dict[str, Any]]:
        if isinstance(value, list):
            records = []
            for item in value:
                if isinstance(item, dict):
                    records.append(self.material_record(group_id, item))
            return records

        if isinstance(value, dict) and "items" in value:
            return [
                self.material_record(group_id, item, family_id=key, schedule=value.get("availability"), source=value.get("source"))
                for item in value.get("items", [])
                if isinstance(item, dict)
            ]

        if isinstance(value, dict) and "name" in value:
            return [self.material_record(group_id, value, family_id=key, source=value.get("source"))]

        if isinstance(value, dict):
            nested: list[dict[str, Any]] = []
            for nested_key, nested_value in value.items():
                nested.extend(self._flatten_material_value(group_id, f"{key}.{nested_key}", nested_value))
            return nested

        return []

    def material_record(
        self,
        group_id: str,
        item: dict[str, Any],
        family_id: str | None = None,
        schedule: list[str] | None = None,
        source: str | None = None,
    ) -> dict[str, Any]:
        item_id = str(item.get("id") or slugify(str(item.get("name", ""))))
        return {
            "id": item_id,
            "slug": slugify(str(item.get("name") or item_id)),
            "name": item.get("name"),
            "group": group_id,
            "family": family_id,
            "rarity": item.get("rarity"),
            "source": source or item.get("source") or item.get("sources"),
            "availability": schedule or item.get("availability"),
            "used_by_characters": item.get("characters", []),
            "used_by_weapons": item.get("weapons", []),
            "icon_url": source_image_url(self.base_url, "materials", item_id),
        }

    def enemy(self, item: dict[str, Any]) -> dict[str, Any]:
        item_id = str(item.get("id") or slugify(str(item.get("name", ""))))
        return {
            "id": item_id,
            "slug": slugify(str(item.get("name") or item_id)),
            "name": item.get("name"),
            "region": item.get("region"),
            "type": item.get("type"),
            "family": item.get("family"),
            "description": item.get("description"),
            "drops": item.get("drops", []),
            "artifacts": item.get("artifacts", []),
            "icon_url": source_image_url(self.base_url, "enemies", item_id),
        }

    def domain(self, item: dict[str, Any]) -> dict[str, Any]:
        item_id = str(item.get("id") or slugify(str(item.get("name", ""))))
        return {
            "id": item_id,
            "slug": slugify(str(item.get("name") or item_id)),
            "name": item.get("name"),
            "domain_type": item.get("type"),
            "nation": item.get("nation"),
            "location": item.get("location"),
            "requirements": item.get("requirements", []),
            "recommended_elements": item.get("recommendedElements", []),
            "rewards": item.get("rewards", []),
            "enemy_waves": item.get("enemies", []),
            "icon_url": source_image_url(self.base_url, "domains", item_id),
        }
