#!/usr/bin/env python3
"""
Fetch a URL, save HTML, and list candidate asset URLs (does not overwrite
homepage evidence files snapshots/homepage-verified.html or snapshots/asset-list.json).
Usage: python scripts/extract_assets.py <url>
"""
import sys
from urllib.request import urlopen
from urllib.parse import urljoin
import re
import json
import os


def fetch(url):
    with urlopen(url) as r:
        return r.read().decode("utf-8", errors="ignore")


def find_urls(html, base):
    urls = set()
    for m in re.finditer(r'(?:src|href)=["\']([^"\']+)["\']', html, re.I):
        urls.add(urljoin(base, m.group(1)))
    for m in re.finditer(r"url\(([^)]+)\)", html, re.I):
        u = m.group(1).strip(" \"'")
        if u:
            urls.add(urljoin(base, u))
    return sorted(urls)


def main():
    if len(sys.argv) < 2:
        print("Usage: extract_assets.py <url>")
        sys.exit(1)
    url = sys.argv[1]
    out_dir = os.path.join(os.path.dirname(__file__), "..", "snapshots")
    os.makedirs(out_dir, exist_ok=True)
    print("Fetching", url)
    html = fetch(url)
    safe_name = re.sub(r"[^\w.-]+", "_", url.split("://", 1)[-1].split("/")[0])[:80]
    snapshot_path = os.path.join(out_dir, f"extract-{safe_name}.html")
    with open(snapshot_path, "w", encoding="utf-8") as f:
        f.write(html)
    print("Saved HTML snapshot to", snapshot_path)

    urls = find_urls(html, url)
    assets_path = os.path.join(out_dir, f"extract-{safe_name}-urls.json")
    with open(assets_path, "w", encoding="utf-8") as f:
        json.dump({"url": url, "assets": urls}, f, indent=2)
    print("Found", len(urls), "asset URLs. See", assets_path)


if __name__ == "__main__":
    main()
