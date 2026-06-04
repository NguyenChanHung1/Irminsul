from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any


@dataclass(frozen=True)
class ValidationIssue:
    entity_type: str
    index: int
    field: str
    message: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def validate_dataset(data: dict[str, list[dict[str, Any]]]) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []

    for entity_type, records in data.items():
        seen_ids: set[str] = set()
        for index, record in enumerate(records):
            record_id = record.get("id")
            if not record_id:
                issues.append(ValidationIssue(entity_type, index, "id", "Missing normalized id."))
            elif record_id in seen_ids:
                issues.append(ValidationIssue(entity_type, index, "id", f"Duplicate id: {record_id}"))
            else:
                seen_ids.add(str(record_id))

            if not record.get("name"):
                issues.append(ValidationIssue(entity_type, index, "name", "Missing display name."))

    return issues
