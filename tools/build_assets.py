"""Builds every generated file under assets/ from the source material on this machine.

Run from anywhere:  python tools/build_assets.py

Sources (relative to the Desktop folder that holds Marketing/ and the app repos):
  Marketing/App Store Optimization/appstore/build/<app>/shots/      clean app screens (all already published on the App Store)
  Marketing/App Store Optimization/App Store Screenshots/<App>/     the 10 finished App Store screenshots per app
  Marketing/App Store Optimization/App Store Screenshots/<App>/Creative Assets/header.png   wide banner per app
  Marketing/App Store Optimization/appstore/assets/                 app icons and fonts
  trivianight/trivia_dataset.csv             questions for the Trivial demo
  daily/assets/data/pico.db                  Wordform answers for the Pico demo

Only screens that already appear in the published App Store screenshots are used, so the site
never shows anything that is not public already.
"""

import csv
import json
import random
import sqlite3
from pathlib import Path

from fontTools import subset
from PIL import Image

SITE = Path(__file__).resolve().parent.parent
MARKETING = SITE.parent
DESKTOP = MARKETING.parent
APPSTORE = MARKETING / "App Store Optimization" / "appstore"
STORE_SHOTS = MARKETING / "App Store Optimization" / "App Store Screenshots"
OUT = SITE / "assets"

APPS = {"cents": "Cents", "lckdin": "Lckdin", "pico": "Pico", "trivial": "Trivial"}

# Screens shown inside the hero phones.
HERO_SCREENS = {
    "cents": "log",
    "lckdin": "heatmap",
    "pico": "home",
    "trivial": "home",
}


def save_webp(im, path, width, quality=82):
    path.parent.mkdir(parents=True, exist_ok=True)
    im = im.convert("RGB")
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(path, "WEBP", quality=quality, method=6)
    return im.size


def build_images():
    for key, name in APPS.items():
        # Hero phone screen.
        src = APPSTORE / "build" / key / "shots" / f"{HERO_SCREENS[key]}.png"
        save_webp(Image.open(src), OUT / "img" / "screens" / f"{key}.webp", 600)

        # Icon.
        save_webp(Image.open(APPSTORE / "assets" / "icons" / f"{key}.png"), OUT / "img" / "icons" / f"{key}.webp", 256, 90)

        # The ten App Store screenshots.
        for i in range(1, 11):
            src = STORE_SHOTS / name / f"{i:02d}.png"
            save_webp(Image.open(src), OUT / "img" / "store" / key / f"{i:02d}.webp", 420, 80)

        # Wide banner, plus a centred crop for narrow screens.
        banner = Image.open(STORE_SHOTS / name / "Creative Assets" / "header.png").convert("RGB")
        save_webp(banner, OUT / "img" / "banner" / f"{key}-wide.webp", 1800, 80)
        w, h = banner.size
        crop_w = round(h * 1.25)
        left = (w - crop_w) // 2
        save_webp(banner.crop((left, 0, left + crop_w, h)), OUT / "img" / "banner" / f"{key}-narrow.webp", 900, 80)

    # The iPhone frame drawn around the hero screens. The screen sits 100px in from the
    # left and top of the 1520 x 3068 frame; site.css uses the same proportions.
    for colour in ("silver", "deep-blue"):
        frame = Image.open(APPSTORE / "assets" / "frames" / f"iphone-17-pro-max-{colour}.png")
        frame = frame.resize((640, round(frame.height * 640 / frame.width)), Image.LANCZOS)
        frame.save(OUT / "img" / f"frame-{colour}.webp", "WEBP", quality=90, method=6)

    # Touch icon and Open Graph image are rendered separately (tools/render_og.py).


def build_fonts():
    fonts = OUT / "fonts"
    fonts.mkdir(parents=True, exist_ok=True)
    src = APPSTORE / "assets" / "fonts"
    for name in ("inter-var.woff2", "archivo-var.woff2"):
        (fonts / name).write_bytes((src / name).read_bytes())

    # The monospace faces are only used for numbers and short labels in the demos,
    # so a Basic Latin subset is enough.
    for ttf, out in (("jetbrains-mono-700.ttf", "jetbrains-mono-700.woff2"), ("plex-mono-600.ttf", "plex-mono-600.woff2"),
                     ("archivo-narrow-700.ttf", "archivo-narrow-700.woff2")):
        options = subset.Options()
        options.flavor = "woff2"
        options.layout_features = ["kern", "liga", "tnum"]
        font = subset.load_font(str(src / ttf), options)
        subsetter = subset.Subsetter(options)
        subsetter.populate(unicodes=list(range(0x20, 0x7F)) + [0xD7, 0x2022, 0x2013, 0x2014, 0x2019, 0xB7])
        subsetter.subset(font)
        subset.save_font(font, str(fonts / out), options)


def clean_option(text):
    text = text.strip()
    return text[:1].upper() + text[1:]


# Topics kept off a page that prospective clients read: alcohol and religion.
SKIP_TOPICS = ("drink",)
SKIP_WORDS = ("religion", "wine", "beer", "spirit", "alcohol", "vodka", "whisk", "liquor", "cocktail", "god", "church")


def build_trivia():
    rows = list(csv.DictReader(open(DESKTOP / "trivianight" / "trivia_dataset.csv", encoding="utf-8")))
    pool = []
    for r in rows:
        if r["difficulty"] not in ("1", "2") or r["category"].split(".")[0] in SKIP_TOPICS:
            continue
        text = r["question"] + r["answer"] + r["mcq"]
        if "�" in text or len(r["question"]) > 120 or any(w in text.lower() for w in SKIP_WORDS):
            continue
        answer = clean_option(r["answer"].split(",")[0])
        wrong = [clean_option(w) for w in r["mcq"].split(",") if w.strip()]
        if len(wrong) != 3 or answer in wrong or len(answer) > 32 or any(len(w) > 32 for w in wrong):
            continue
        pool.append({"q": r["question"], "a": answer, "w": wrong, "d": int(r["difficulty"]),
                     "c": r["category"].split(".")[0]})

    # A spread across topics rather than whatever topic happens to be largest.
    random.seed(20261021)
    by_topic = {}
    for item in pool:
        by_topic.setdefault(item["c"], []).append(item)
    picked = []
    for topic, items in sorted(by_topic.items()):
        picked += random.sample(items, min(len(items), 16))
    random.shuffle(picked)
    for item in picked:
        del item["c"]

    js = "// Generated by tools/build_assets.py from Trivial's own question bank.\n"
    js += "window.TRIVIA = " + json.dumps(picked, ensure_ascii=False, separators=(",", ":")) + ";\n"
    (OUT / "js" / "trivia-data.js").write_text(js, encoding="utf-8")
    return len(picked)


def build_words():
    db = sqlite3.connect(DESKTOP / "daily" / "assets" / "data" / "pico.db")
    words = [w for (w,) in db.execute("select word from wf_answers where len = 5 order by word")]
    js = "// Generated by tools/build_assets.py from Pico's five-letter Wordform answers.\n"
    js += "window.WORDS = " + json.dumps(" ".join(words)) + ".split(' ');\n"
    (OUT / "js" / "words-data.js").write_text(js, encoding="utf-8")
    return len(words)


if __name__ == "__main__":
    (OUT / "js").mkdir(parents=True, exist_ok=True)
    build_images()
    build_fonts()
    print("trivia questions:", build_trivia())
    print("wordform answers:", build_words())
