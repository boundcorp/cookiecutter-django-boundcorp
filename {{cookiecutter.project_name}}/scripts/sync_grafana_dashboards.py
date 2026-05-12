#!/usr/bin/env python3
import json
import os
from pathlib import Path

import requests

GRAFANA_URL = os.environ["GRAFANA_URL"].rstrip("/")
GRAFANA_TOKEN = os.environ["GRAFANA_SA_TOKEN"]
PROMETHEUS_DS_UID = os.environ["GRAFANA_PROMETHEUS_DATASOURCE_UID"]
DASHBOARD_DIR = Path(os.environ.get("GRAFANA_DASHBOARD_DIR", "docs/dashboards"))
FOLDER_UID = os.environ.get("GRAFANA_FOLDER_UID", "").strip()
FOLDER_TITLE = os.environ.get("GRAFANA_FOLDER_TITLE", "").strip()


def grafana_request(method, path, **kwargs):
    response = requests.request(
        method,
        f"{GRAFANA_URL}{path}",
        headers={
            "Authorization": f"Bearer {GRAFANA_TOKEN}",
            "Content-Type": "application/json",
        },
        timeout=30,
        **kwargs,
    )
    response.raise_for_status()
    if response.content:
        return response.json()
    return None


def normalize_dashboard(raw_dashboard):
    dashboard = json.loads(json.dumps(raw_dashboard))
    dashboard["editable"] = False
    dashboard["refresh"] = "30s"
    tags = set(dashboard.get("tags", []))
    tags.add("json-managed")
    dashboard["tags"] = sorted(tags)
    timepicker = dashboard.setdefault("timepicker", {})
    timepicker["refresh_intervals"] = ["10s", "30s", "1m", "5m", "15m"]
    return replace_prometheus_uid(dashboard)


def replace_prometheus_uid(value):
    if isinstance(value, dict):
        return {key: replace_prometheus_uid(item) for key, item in value.items()}
    if isinstance(value, list):
        return [replace_prometheus_uid(item) for item in value]
    if value == "__PROMETHEUS_DS_UID__":
        return PROMETHEUS_DS_UID
    return value


def ensure_folder_uid():
    if FOLDER_UID:
        return FOLDER_UID
    if not FOLDER_TITLE:
        return ""

    folders = grafana_request("GET", "/api/folders")
    for folder in folders:
        if folder.get("title") == FOLDER_TITLE:
            return folder["uid"]

    created = grafana_request("POST", "/api/folders", json={"title": FOLDER_TITLE})
    return created["uid"]


def upload_dashboards():
    folder_uid = ensure_folder_uid()
    dashboard_paths = sorted(DASHBOARD_DIR.glob("*.json"))
    if not dashboard_paths:
        raise SystemExit(f"No dashboard JSON files found in {DASHBOARD_DIR}")

    for path in dashboard_paths:
        dashboard = normalize_dashboard(json.loads(path.read_text()))
        payload = {
            "dashboard": dashboard,
            "overwrite": True,
            "message": f"Sync {path.name} from GitHub Actions",
        }
        if folder_uid:
            payload["folderUid"] = folder_uid
        result = grafana_request("POST", "/api/dashboards/db", json=payload)
        print(f"Synced {path} -> {result['url']}")


if __name__ == "__main__":
    upload_dashboards()
