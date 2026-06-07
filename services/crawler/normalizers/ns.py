from __future__ import annotations

from datetime import datetime
import re
from typing import Any

from normalizers.genshin_dev import slugify


WEAPON_TYPES = {
    "WEAPON_SWORD_ONE_HAND": "Sword",
    "WEAPON_CLAYMORE": "Claymore",
    "WEAPON_POLE": "Polearm",
    "WEAPON_POLEARM": "Polearm",
    "WEAPON_CATALYST": "Catalyst",
    "WEAPON_BOW": "Bow",
}

QUALITY_TO_RARITY = {
    "QUALITY_ORANGE": 5,
    "QUALITY_PURPLE": 4,
    "QUALITY_BLUE": 3,
    "QUALITY_GREEN": 2,
    "QUALITY_WHITE": 1,
}


def rank_to_int(value: Any) -> int | None:
    if isinstance(value, int):
        return value
    if isinstance(value, str):
        return QUALITY_TO_RARITY.get(value)
    return None


def localized_name(item: dict[str, Any]) -> str | None:
    return item.get("name") or item.get("en")


def parse_datetime(value: str | None) -> str | None:
    if not value or value.startswith("1970-01-01"):
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d %H:%M:%S").date().isoformat()
    except ValueError:
        return value


def icon_asset_url(static_base_url: str, version: str, icon_name: str | None) -> str | None:
    if not icon_name:
        return None
    return f"{static_base_url.rstrip('/')}/assets/gi/{icon_name}.webp"


def element_icon_url(element: str | None) -> str | None:
    return None


REFINEMENT_NUMBER_RE = re.compile(
    r"(?P<number>\d+(?:\.\d+)?)(?P<suffix>%?)"
)


def ranked_refinement_entries(refinement: Any) -> list[dict[str, Any]]:
    if not isinstance(refinement, dict):
        return []
    return [entry for rank in range(1, 6) if isinstance(entry := refinement.get(str(rank)), dict)]


def combine_refinement_descriptions(descriptions: list[str]) -> str | None:
    if not descriptions:
        return None

    base = descriptions[0]
    token_lists = [list(REFINEMENT_NUMBER_RE.finditer(description)) for description in descriptions]
    if any(len(tokens) < len(token_lists[0]) for tokens in token_lists[1:]):
        return base

    parts: list[str] = []
    last_index = 0

    for token_index, base_token in enumerate(token_lists[0]):
        ranked_tokens = [tokens[token_index] for tokens in token_lists]
        if any(token.group("suffix") != base_token.group("suffix") for token in ranked_tokens):
            continue

        values = [token.group("number") for token in ranked_tokens]
        if len(set(values)) <= 1:
            continue

        parts.append(base[last_index : base_token.start("number")])
        parts.append("/".join(values))
        last_index = base_token.end("number")

    if last_index == 0:
        return base

    parts.append(base[last_index:])
    return "".join(parts)


def refinement_name(refinement: Any) -> str | None:
    if isinstance(refinement, dict):
        if refinement.get("name"):
            return refinement.get("name")
        entries = ranked_refinement_entries(refinement)
        if entries:
            return entries[0].get("name")
    return None


def refinement_description(refinement: Any) -> str | None:
    if isinstance(refinement, dict):
        if refinement.get("desc"):
            return refinement.get("desc")
        descriptions = [
            entry.get("desc")
            for entry in ranked_refinement_entries(refinement)
            if isinstance(entry.get("desc"), str) and entry.get("desc")
        ]
        return combine_refinement_descriptions(descriptions)
    return None


class NSNormalizer:
    """Normalize NS current-version data into the crawler output contract."""

    def __init__(self, static_base_url: str, version: str) -> None:
        self.static_base_url = static_base_url
        self.version = version

    def normalize(self, entity_type: str, payload: Any) -> list[dict[str, Any]]:
        match entity_type:
            case "characters":
                return self.characters(payload)
            case "weapons":
                return self.weapons(payload)
            case "artifacts":
                return self.artifacts(payload)
            case "materials":
                return self.materials(payload)
            case "enemies":
                return self.enemies(payload)
            case _:
                return []

    def characters(self, payload: dict[str, Any]) -> list[dict[str, Any]]:
        records = []
        for item_id, item in payload.get("list", {}).items():
            detail = payload.get("details", {}).get(item_id) or {}
            info = detail.get("chara_info") or {}
            name = localized_name(detail) or localized_name(item) or item_id
            birth = info.get("birth") or item.get("birth") or []
            element = detail.get("element") or item.get("element") or info.get("vision")
            weapon_type = detail.get("weapon") or item.get("weapon") or item.get("weapon_type")

            records.append(
                {
                    "id": str(item_id),
                    "slug": slugify(name),
                    "name": name,
                    "rarity": rank_to_int(detail.get("rarity") or item.get("rank")),
                    "element": element,
                    "element_icon_url": element_icon_url(element),
                    "weapon_type": WEAPON_TYPES.get(weapon_type, weapon_type),
                    "weapon_type_icon_url": icon_asset_url(self.static_base_url, self.version, weapon_type),
                    "weapon_type_url": icon_asset_url(self.static_base_url, self.version, weapon_type),
                    "nation": self.region_name(info.get("region")),
                    "affiliation": info.get("native"),
                    "title": info.get("title"),
                    "description": detail.get("desc") or item.get("desc") or info.get("detail"),
                    "release_date": parse_datetime(info.get("release_date") or item.get("release")),
                    "birthday": f"{birth[0]:02d}-{birth[1]:02d}" if len(birth) == 2 else None,
                    "constellation": info.get("constellation"),
                    "iconName": detail.get("icon") or item.get("icon"),
                    "icon_url": icon_asset_url(self.static_base_url, self.version, detail.get("icon") or item.get("icon")),
                    "base_hp": detail.get("base_hp"),
                    "base_atk": detail.get("base_atk"),
                    "base_def": detail.get("base_def"),
                    "crit_rate": detail.get("crit_rate"),
                    "crit_dmg": detail.get("crit_dmg"),
                    "stats_modifier": detail.get("stats_modifier") or {},
                    "ascension_materials": self.material_steps(detail.get("materials", {}).get("ascensions")),
                    "talent_materials": self.material_steps(detail.get("materials", {}).get("talents"), start_level=2),
                    "talents": detail.get("skills", []),
                    "passive_talents": detail.get("passives", []),
                    "constellations": detail.get("constellations", []),
                    "voice_cast": info.get("va") or {},
                    "stories": info.get("stories") or [],
                    "quotes": info.get("quotes") or [],
                }
            )

        return records

    def weapons(self, payload: dict[str, Any]) -> list[dict[str, Any]]:
        records = []
        for item_id, item in payload.get("list", {}).items():
            detail = payload.get("details", {}).get(item_id) or {}
            name = localized_name(detail) or localized_name(item) or item_id
            weapon_prop = detail.get("weapon_prop") or {}
            refinement = detail.get("refinement") or {}
            stats_modifier = detail.get("stats_modifier") or {}
            if detail.get("ascension"):
                stats_modifier = {**stats_modifier, "ascension": detail.get("ascension")}

            records.append(
                {
                    "id": str(item_id),
                    "slug": slugify(name),
                    "name": name,
                    "rarity": detail.get("rarity") or item.get("rank"),
                    "weapon_type": WEAPON_TYPES.get(detail.get("weapon_type") or item.get("type"), detail.get("weapon_type") or item.get("type")),
                    "base_attack": item.get("atk") or weapon_prop.get("base_atk"),
                    "sub_stat": item.get("sub") or weapon_prop.get("sub"),
                    "passive_name": refinement_name(refinement),
                    "passive_description": refinement_description(refinement),
                    "description": detail.get("desc") or item.get("desc"),
                    "ascension_materials": detail.get("materials", {}),
                    "stats_modifier": stats_modifier,
                    "iconName": detail.get("icon") or item.get("icon"),
                    "icon_url": icon_asset_url(self.static_base_url, self.version, detail.get("icon") or item.get("icon")),
                    "story": detail.get("story") or [],
                }
            )

        return records

    def artifacts(self, payload: dict[str, Any]) -> list[dict[str, Any]]:
        records = []
        for item_id, item in payload.get("list", {}).items():
            set_values = list((item.get("set") or {}).values())
            bonuses = [entry for entry in set_values if isinstance(entry, dict)]
            name = ((bonuses[0] or {}).get("name") or {}).get("en") if bonuses else None

            records.append(
                {
                    "id": str(item_id),
                    "slug": slugify(name or item_id),
                    "name": name or item_id,
                    "ranks": item.get("rank") or [],
                    "max_rarity": max(item.get("rank") or []) if item.get("rank") else None,
                    "two_piece_bonus": (((bonuses[0] or {}).get("desc") or {}).get("en") if len(bonuses) > 0 else None),
                    "four_piece_bonus": (((bonuses[1] or {}).get("desc") or {}).get("en") if len(bonuses) > 1 else None),
                    "set_bonuses": item.get("set") or {},
                    "parts": (payload.get("details", {}).get(item_id) or {}).get("parts") or {},
                    "iconName": item.get("icon"),
                    "icon_url": icon_asset_url(self.static_base_url, self.version, item.get("icon")),
                }
            )

        return records

    def materials(self, payload: dict[str, Any]) -> list[dict[str, Any]]:
        records = []
        for item_id, item in payload.items():
            if not isinstance(item, dict):
                continue
            if item.get("item_type") not in {"ITEM_MATERIAL", "ITEM_VIRTUAL"}:
                continue
            name = localized_name(item)
            records.append(
                {
                    "id": str(item_id),
                    "slug": slugify(name or item_id),
                    "name": name or item_id,
                    "group": item.get("type") or item.get("material_type"),
                    "family": item.get("material_type"),
                    "rarity": item.get("rank"),
                    "description": item.get("desc"),
                    "source": item.get("source_list") or [],
                    "availability": [],
                    "iconName": item.get("icon"),
                    "icon_url": icon_asset_url(self.static_base_url, self.version, item.get("icon")),
                }
            )

        return records

    def enemies(self, payload: dict[str, Any]) -> list[dict[str, Any]]:
        records = []
        for item_id, item in payload.get("list", {}).items():
            detail = payload.get("details", {}).get(item_id) or {}
            name = localized_name(detail) or localized_name(item) or item_id
            records.append(
                {
                    "id": str(item_id),
                    "slug": slugify(name),
                    "name": name,
                    "region": None,
                    "type": detail.get("codex") or item.get("codex"),
                    "family": detail.get("title"),
                    "description": detail.get("desc") or item.get("desc"),
                    "drops": detail.get("reward") or [],
                    "artifacts": [],
                    "iconName": detail.get("icon") or item.get("icon"),
                    "icon_url": icon_asset_url(self.static_base_url, self.version, detail.get("icon") or item.get("icon")),
                }
            )

        return records

    def region_name(self, region: str | None) -> str | None:
        if not region:
            return None
        return region.removeprefix("ASSOC_TYPE_").replace("_", " ").title()

    def material_steps(self, steps: Any, start_level: int = 20) -> dict[str, Any]:
        if not isinstance(steps, list):
            return {}
        if steps and isinstance(steps[0], list):
            steps = steps[0]

        if start_level == 20:
            labels = ["level_20", "level_40", "level_50", "level_60", "level_70", "level_80"]
        else:
            labels = [f"level_{level}" for level in range(start_level, start_level + len(steps))]

        return {
            labels[index] if index < len(labels) else f"level_{start_level + index}": step
            for index, step in enumerate(steps)
        }
