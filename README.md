# Soirée · Celebration & Event Planner

A static web app that plans **weddings, birthdays and community events**: smart budget, dated timeline, vendor checklists, personalised ideas and a chat assistant. It runs entirely in the browser, so it deploys free on **GitHub Pages** with no server.

## Deploy on GitHub Pages (about 3 minutes)

1. Unzip this project on your computer.
2. On GitHub, create a **new repository** (public, any name, e.g. `celebration-planner`).
3. Click **uploading an existing file**, open the unzipped folder and drag in **everything inside it** (`index.html`, the `.js` files, `style.css`, the `vendor` folder, `README.md`, and the `.github` folder if your computer shows hidden files). Click **Commit changes**.
4. Go to **Settings → Pages**. Under **Build and deployment → Source**, choose **Deploy from a branch**, pick branch **main** and folder **/ (root)**, then **Save**.
5. Wait 1–2 minutes. Your site appears at `https://YOUR-USERNAME.github.io/REPO-NAME/`.

`index.html` must be at the top level of the repo (not inside another folder), otherwise you will see a 404.

**Using git instead?**
```bash
git init && git add . && git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/REPO-NAME.git
git push -u origin main
```
Then in **Settings → Pages** choose **GitHub Actions** as the source (the included workflow in `.github/workflows/pages.yml` deploys the site on every push), or use the branch option above.

## Features

**Planning**
- 3-step wizard: event type, essentials (date, guests, budget, currency) and vibe
- Smart budget with an animated donut chart, **what-if sliders** that rebalance the other categories, and a spent tracker
- Timeline scaled to the days you have left, task tick-offs, **calendar (.ics) export**
- Vendor checklists with questions to ask and progress bars
- Live **countdown** to your event, plus a notes pad

**Interactive tools**
- **Guest list and RSVPs:** add one by one or in bulk, mark coming / pending / declined, diet and plus-ones, search, filter, CSV export, over-capacity cost warning
- **Seating planner:** drag guests onto tables (or tap a guest, then a table), auto-seat by group, add or remove tables
- **Day-of run of show:** editable schedule you can copy and send to vendors
- **Invitation studio:** edit text, pick a palette and style, flip the card, download front and back as PNG
- **Theme cards:** flip a card for details and apply its palette to the whole site
- **Achievements:** 12 badges that unlock as you plan
- Share link, JSON export and import, print view, chat assistant

**3D and animation**
- A real-time **Three.js** background scene (gifts, balloons, rings, stars) that follows your mouse, shifts with scroll and changes with the event type. **Click the balloons to pop them.**
- 3D tilt-and-glare cards, a tiltable 3D seating floor, flip-card invitation and theme cards, a spinning 3D cube loader, flip-clock countdown
- Gradients, scroll reveals, count-up numbers, confetti, scroll progress bar
- Respects "reduce motion" and falls back gracefully if WebGL is unavailable

Your plan and progress are saved in the browser (`localStorage`).

## Optional: turn on Claude AI

Click the badge in the top bar ("Smart engine · add AI key") and paste your Anthropic API key. Plans then include AI-personalised themes, menus and activities, and the chat uses Claude.

- The key is stored **only in your browser** and sent **only to api.anthropic.com**.
- Because this is a static site, never put your key in the code or the repo. Each visitor adds their own key, or leaves it off and uses the built-in engine.
- A key typed into any browser can be read by someone using that browser, so use a key with a spending limit.

## Project files

| File | Purpose |
|---|---|
| `index.html` | Page structure: wizard, dashboard tabs, chat |
| `style.css` | Theme, animations, 3D styles, print styles |
| `app.js` | Core UI: wizard, budget, timeline, vendors, ideas, badges, import and export, chat |
| `extras.js` | Countdown, guest manager, seating planner, run of show, invitation studio |
| `fx3d.js` | Three.js background scene, balloon popping, 3D tilt effect |
| `engine.js` | Planning engine and optional Claude calls |
| `data.js` | Budgets, milestones, vendors, themes and ideas per event type |
| `vendor/three.min.js` | Three.js (MIT licence, included so no CDN is needed) |
| `.github/workflows/pages.yml` | Optional automatic deploy |

## Customising

- **Add an event type:** add an entry in `data.js` (budget percentages must add up to 1.0) and a card in the wizard in `index.html`.
- **Change colours:** edit the CSS variables at the top of `style.css`.
- **Test locally:** open `index.html` in a browser, or run `python -m http.server` in this folder.

Budget figures are planning guides, not quotes. Confirm prices with vendors.
