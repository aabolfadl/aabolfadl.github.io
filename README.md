# aabolfadl.github.io

My portfolio as an iPhone app developer: four live App Store apps (Cents, Lckdin, Pico, Trivial),
each with a small piece you can try in the browser.

Live at **https://aabolfadl.github.io/**. It is a plain static site served by GitHub Pages:
no framework, no build step to publish. Push to `main` and it is live within a minute or two.

```
index.html              the whole page
assets/css/site.css     styles (mobile first)
assets/js/site.js       scroll effects and the four demos
assets/js/*-data.js     demo content: Trivial questions, Pico words (generated)
assets/img/, fonts/     generated images and fonts
app-ads.txt             AdMob's seller record for the apps. Keep it here, unchanged.
tools/                  scripts that regenerate assets/ from the app repos
```

## Regenerating the assets

The images, fonts and demo data come from the App Store screenshots and app repos on my machine
(`Desktop/Marketing`, `Desktop/trivianight`, `Desktop/daily`). After changing any of them:

```
python tools/build_assets.py   # screenshots, banners, icons, fonts, demo data
python tools/render_og.py      # link preview image and home-screen icon (needs Playwright)
```

To preview locally: `python -m http.server 8000`, then open http://localhost:8000.
