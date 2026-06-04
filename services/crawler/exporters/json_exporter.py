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
        path = self.output_dir / f"{timestamp}-game-data-crawl-job.json"
        write_json_atomically(path, dataset)
        return path
