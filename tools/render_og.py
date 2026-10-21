"""Renders assets/img/og.jpg (1200 x 630 link preview) and assets/img/apple-touch-icon.png from tools/og.html.

Run after tools/build_assets.py:  python tools/render_og.py
"""

from pathlib import Path

from playwright.sync_api import sync_playwright

SITE = Path(__file__).resolve().parent.parent
IMG = SITE / "assets" / "img"

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1200, "height": 900})
    page.goto((SITE / "tools" / "og.html").as_uri(), wait_until="networkidle")
    page.evaluate("document.fonts.ready")
    page.wait_for_timeout(400)
    # JPEG keeps the preview under WhatsApp's ~300 KB limit for link images.
    page.locator("#og").screenshot(path=str(IMG / "og.jpg"), type="jpeg", quality=86)
    page.locator("#touch").screenshot(path=str(IMG / "apple-touch-icon.png"))
    browser.close()
print("wrote og.jpg and apple-touch-icon.png")
