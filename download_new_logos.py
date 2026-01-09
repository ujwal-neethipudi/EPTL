#!/usr/bin/env python3
"""
Download logos for entities in map_data.csv
Extracts logic from logos.ipynb and saves to new-logos/ directory
All logos are converted to PNG format with standard naming convention
"""
import os
import re
import time
import json
import mimetypes
import argparse
from pathlib import Path
from typing import Optional, Tuple, Dict, Any, List
from io import BytesIO

import pandas as pd
import requests
from PIL import Image

# Configuration
ROOT = Path(".")
CSV_IN = ROOT / "map_data.csv"
OUTPUT_DIR = ROOT / "new-logos"
FAILED_LOGOS_FILE = ROOT / "failed_logos.txt"

BRANDFETCH_KEY = ""  # Add your key if you have one, else leave empty

# Basic settings
RATE_DELAY_SEC = 0.25  # Be polite to free endpoints
TIMEOUT = 6  # Seconds for HTTP calls

# Column names in CSV
ENTITY_COL = "Entity"
DOMAIN_COL = "Domain"


def norm_domain(url: str) -> str:
    """Normalize domain: remove protocol, www, get just the domain."""
    if not isinstance(url, str) or not url.strip():
        return ""
    u = url.strip().lower()
    u = re.sub(r"^https?://", "", u)
    u = re.sub(r"^www\.", "", u)
    u = u.split("/")[0]
    u = u.split("?")[0]  # Remove query params
    return u


def slugify(name: str) -> str:
    """Slugify name: lowercase, replace non-alphanumeric with hyphens, max 60 chars."""
    return re.sub(r"[^a-z0-9]+", "-", (name or "logo").lower()).strip("-")[:60]


def domain_to_filename(domain: str) -> str:
    """Convert domain to filename: replace dots with hyphens (change.org -> change-org)."""
    if not domain:
        return ""
    # Normalize domain first
    normalized = norm_domain(domain)
    # Replace dots with hyphens
    filename = normalized.replace(".", "-")
    return filename


def fetch_binary(url: str, headers: Optional[Dict[str, str]] = None, timeout: int = TIMEOUT):
    """Fetch binary content from URL."""
    try:
        r = requests.get(url, headers=headers or {}, timeout=timeout)
        if r.status_code == 200 and r.content and "text/html" not in r.headers.get("content-type", ""):
            return r
    except Exception:
        return None
    return None


def convert_to_png(image_bytes: bytes, source_url: str) -> Optional[bytes]:
    """
    Convert image bytes to PNG format.
    Handles SVG, JPG, WEBP, ICO, PNG formats.
    """
    try:
        # Open image from bytes
        img = Image.open(BytesIO(image_bytes))
        
        # Convert RGBA to RGB if necessary (for formats that don't support transparency)
        if img.mode in ('RGBA', 'LA', 'P'):
            # Keep transparency for PNG
            if img.format == 'PNG':
                pass  # Keep as is
            else:
                # For other formats, convert RGBA to RGB
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                rgb_img.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                img = rgb_img
        elif img.mode not in ('RGB', 'L'):
            img = img.convert('RGB')
        
        # Save to bytes as PNG
        output = BytesIO()
        img.save(output, format='PNG', optimize=True)
        return output.getvalue()
    except Exception as e:
        print(f"  ⚠️  Conversion error: {e}")
        return None


def select_best_brandfetch_logo(payload: Dict[str, Any]) -> Optional[str]:
    """Pick the best logo 'src' from Brandfetch response using type/format/size priority."""
    logos = payload.get("logos") or []
    if not logos:
        return None

    type_rank = {"full": 3, "wordmark": 2, "symbol": 1, "icon": 1}
    fmt_rank = {"svg": 5, "png": 4, "webp": 3, "jpg": 2, "jpeg": 2, "ico": 1}

    candidates = []
    for lg in logos:
        ltype = lg.get("type", "").lower()
        for fmt in lg.get("formats", []):
            src = fmt.get("src")
            if not src:
                continue
            fmt_ext = fmt.get("format", "").lower() or src.split("?")[0].split(".")[-1].lower()
            w = fmt.get("width") or 0
            h = fmt.get("height") or 0
            candidates.append({
                "src": src,
                "type_score": type_rank.get(ltype, 0),
                "fmt_score": fmt_rank.get(fmt_ext, 0),
                "area": (w or 0) * (h or 0)
            })

    if not candidates:
        return None

    candidates.sort(key=lambda c: (c["type_score"], c["fmt_score"], c["area"]), reverse=True)
    return candidates[0]["src"]


def try_brandfetch(domain: str) -> Optional[str]:
    """Try to get logo URL from Brandfetch API."""
    if not BRANDFETCH_KEY:
        return None
    url = f"https://api.brandfetch.io/v2/brands/{domain}"
    try:
        r = requests.get(url, headers={"Authorization": f"Bearer {BRANDFETCH_KEY}"}, timeout=TIMEOUT)
        if r.status_code == 200:
            src = select_best_brandfetch_logo(r.json())
            return src
    except Exception:
        pass
    return None


def try_clearbit(domain: str) -> Optional[str]:
    """Try to get logo URL from Clearbit."""
    url = f"https://logo.clearbit.com/{domain}"
    r = fetch_binary(url, timeout=TIMEOUT)
    return url if r else None


def try_duckduckgo(domain: str) -> Optional[str]:
    """Try to get logo URL from DuckDuckGo."""
    url = f"https://icons.duckduckgo.com/ip3/{domain}.ico"
    r = fetch_binary(url, timeout=TIMEOUT)
    return url if r else None


def resolve_logo_url(domain: str) -> Tuple[str, str]:
    """
    Return (url, source_name).
    Preference: Brandfetch (if key present) > Clearbit > DuckDuckGo
    """
    if not domain:
        return "", "none"

    # Try Brandfetch first if you provided a key (best quality)
    if BRANDFETCH_KEY:
        bf = try_brandfetch(domain)
        if bf:
            return bf, "Brandfetch"

    # Then Clearbit (fast, good coverage)
    cb = try_clearbit(domain)
    if cb:
        return cb, "Clearbit"

    # Then DuckDuckGo favicon
    ddg = try_duckduckgo(domain)
    if ddg:
        return ddg, "DuckDuckGo"

    return "", "none"


def download_logo(domain: str, entity_name: str, output_dir: Path) -> Tuple[bool, str]:
    """
    Download logo for a domain/entity.
    Returns (success: bool, message: str)
    """
    if not domain:
        return False, "No domain provided"

    # Generate filename based on domain
    filename_base = domain_to_filename(domain)
    if not filename_base:
        # Fallback to entity name slug
        filename_base = slugify(entity_name)
    
    output_path = output_dir / f"{filename_base}.png"
    
    # Skip if already exists
    if output_path.exists():
        return True, f"Already exists: {output_path.name}"

    # Resolve logo URL
    url, source = resolve_logo_url(domain)
    if not url:
        return False, f"Could not resolve logo URL"

    # Fetch binary
    resp = fetch_binary(url, timeout=TIMEOUT)
    if not resp:
        return False, f"Failed to fetch from {source}"

    # Convert to PNG
    png_bytes = convert_to_png(resp.content, url)
    if not png_bytes:
        return False, f"Failed to convert to PNG"

    # Save PNG file
    try:
        with open(output_path, "wb") as f:
            f.write(png_bytes)
        return True, f"Downloaded from {source}: {output_path.name}"
    except Exception as e:
        return False, f"Failed to save file: {e}"


def main():
    """Main function to process CSV and download logos."""
    parser = argparse.ArgumentParser(description="Download logos for entities in CSV")
    parser.add_argument("--csv", type=str, default=str(CSV_IN), help="Path to CSV file (default: map_data.csv)")
    parser.add_argument("--output", type=str, default=str(OUTPUT_DIR), help="Output directory (default: new-logos/)")
    args = parser.parse_args()

    csv_path = Path(args.csv)
    output_dir = Path(args.output)
    
    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Check if CSV exists
    if not csv_path.exists():
        print(f"❌ CSV file not found: {csv_path}")
        return

    print(f"📖 Reading CSV: {csv_path}")
    print(f"📁 Output directory: {output_dir}")
    print()

    # Read CSV
    try:
        df = pd.read_csv(csv_path)
    except Exception as e:
        print(f"❌ Failed to read CSV: {e}")
        return

    # Check required columns
    if ENTITY_COL not in df.columns:
        print(f"❌ Required column '{ENTITY_COL}' not found in CSV")
        print(f"   Available columns: {', '.join(df.columns)}")
        return
    if DOMAIN_COL not in df.columns:
        print(f"❌ Required column '{DOMAIN_COL}' not found in CSV")
        print(f"   Available columns: {', '.join(df.columns)}")
        return

    # Track results
    successful = []
    failed = []
    skipped = []

    # Process each row
    total = len(df)
    print(f"Processing {total} entities...")
    print()

    for idx, row in df.iterrows():
        entity = str(row.get(ENTITY_COL, "")).strip()
        domain_raw = str(row.get(DOMAIN_COL, "")).strip()
        
        if not entity:
            failed.append({
                "entity": "(empty)",
                "domain": domain_raw,
                "reason": "No entity name"
            })
            continue

        # Normalize domain
        domain = norm_domain(domain_raw) if domain_raw else ""
        
        print(f"[{idx + 1}/{total}] {entity}", end=" ... ")
        
        if not domain:
            print("❌ No domain")
            failed.append({
                "entity": entity,
                "domain": domain_raw,
                "reason": "No domain provided"
            })
            continue

        # Download logo
        success, message = download_logo(domain, entity, output_dir)
        
        if success:
            if "Already exists" in message:
                print(f"⏭️  {message}")
                skipped.append({"entity": entity, "domain": domain, "message": message})
            else:
                print(f"✅ {message}")
                successful.append({"entity": entity, "domain": domain, "message": message})
        else:
            print(f"❌ {message}")
            failed.append({
                "entity": entity,
                "domain": domain,
                "reason": message
            })

        # Rate limiting
        time.sleep(RATE_DELAY_SEC)

    # Print summary
    print()
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"✅ Successful: {len(successful)}")
    print(f"⏭️  Skipped (already exists): {len(skipped)}")
    print(f"❌ Failed: {len(failed)}")
    print(f"📁 Logos saved to: {output_dir}")

    # Save failed logos report
    if failed:
        print()
        print(f"📝 Writing failed logos report to: {FAILED_LOGOS_FILE}")
        with open(FAILED_LOGOS_FILE, "w", encoding="utf-8") as f:
            f.write("Failed Logo Downloads\n")
            f.write("=" * 60 + "\n\n")
            for item in failed:
                f.write(f"Entity: {item['entity']}\n")
                f.write(f"Domain: {item.get('domain', 'N/A')}\n")
                f.write(f"Reason: {item['reason']}\n")
                f.write("-" * 60 + "\n")
        print(f"✅ Failed logos report saved: {FAILED_LOGOS_FILE}")
    else:
        print()
        print("🎉 All logos downloaded successfully!")


if __name__ == "__main__":
    main()
