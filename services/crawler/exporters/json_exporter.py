from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from core import write_json_atomically


class JsonExporter:
    def __init__(self, output_dir: Path) -> None:
        self.output_dir = output_dir

    def export_dataset(self, dataset: dict[str, Any]) -> Path:
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        self.output_dir.mkdir(parents=True, exist_ok=True)

        write_json_atomically(self.output_dir / "metadata.json", dataset.get("metadata", {}))

        data = dataset.get("data", {})
        if isinstance(data, dict):
            for entity_name, records in data.items():
                write_json_atomically(self.output_dir / entity_name / "raw.json", {"data": records})

        snapshot_path = self.output_dir / f"{timestamp}-game-data-crawl-job.json"
        write_json_atomically(snapshot_path, dataset)
        write_json_atomically(self.output_dir / "gi-crawl-job.json", dataset)
        return self.output_dir
