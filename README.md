# The Stack — Daily Supplement Tracker

A single-file, no-build tracker for your daily/weekly/workout-day supplement stack.
Runs entirely in the browser — no server, no database, no dependencies.

## Deploy on GitHub Pages (2 minutes)

1. Create a new GitHub repository (e.g. `supplement-tracker`).
2. Upload `index.html` to the repo root (drag-and-drop on github.com works fine, or:
   ```
   git init
   git add index.html
   git commit -m "Add supplement tracker"
   git branch -M main
   git remote add origin https://github.com/<your-username>/supplement-tracker.git
   git push -u origin main
   ```
3. In the repo, go to **Settings → Pages**.
4. Under **Build and deployment → Source**, choose **Deploy from a branch**.
5. Set branch to `main` and folder to `/ (root)`, then **Save**.
6. GitHub gives you a live URL within a minute or two, usually:
   `https://<your-username>.github.io/supplement-tracker/`

Open that URL on your phone, then use your browser's **"Add to Home Screen"**
option so it opens like an app.

## New: browsing history/future + editing your cabinet

- **Week strip navigation** — use the ‹ › arrows to move between weeks, then tap any
  day (past, today, or future) to view that day's checklist below. Past days can
  still be checked/corrected; future days show what's scheduled but can't be
  checked off yet.
- **Manage cabinet** — tap the button top-right to switch into edit mode. From
  there you can add, edit, delete, and reorder (↑ / ↓) any supplement in any
  section. Every add, edit, or delete asks **"Are you sure?"** before it saves —
  nothing changes until you confirm.

## Notifications are now fully dynamic — one file drives everything

`data/items.json` and `data/schedule.json` in this repo are the **single source
of truth**, read by both the web app and the GitHub Action:

- **`data/items.json`** — your supplement list: name, dose, section, and
  schedule type (daily / workout-day / specific weekday). Editing it changes
  both what the app shows *and* what your phone notifications say — no need to
  touch any workflow file.
- **`data/schedule.json`** — what time each notification fires, written in
  **IST**, e.g. `"morning": "07:30"`. No UTC conversion needed.

You can edit either file two ways:
1. **Through the app** — Manage Cabinet for items, or the ⚙ Sync settings
   panel for notification times. This requires a one-time GitHub connection
   (below) so the app can commit the change back to your repo.
2. **Directly on GitHub** — open `data/items.json` or `data/schedule.json` in
   the repo, click the pencil icon, edit, commit. Works with no setup at all.

If you edit through the app without connecting GitHub, changes still save in
that browser, but won't reach your notifications until you also edit the file
on GitHub directly.

### Connecting the app to GitHub (optional, enables in-app syncing)

1. In GitHub: **Settings → Developer settings → Fine-grained tokens → Generate new token**.
2. Scope it to **only this repository**, with **Contents: Read and write** permission — nothing else.
3. In the app, tap **⚙ Sync settings**, fill in your GitHub username, repo name, and paste the token.
4. From then on, cabinet edits and schedule changes made in the app commit straight to your repo.

The token is stored only in that browser's local storage and is sent only to
`api.github.com` — never anywhere else. Re-enter it if you clear your browser
data or switch devices.

## How the reminder workflow works

- Every checkbox tap is saved to your browser's `localStorage`, keyed by date —
  so each day's checklist naturally resets.
- The week strip at the top fills in per day as you complete everything scheduled
  for that day.
- Toggling **Workout day** reveals the pre-workout (L-Arginine) section for that day.
- Vitamin D3 (60,000 IU) and Vitamin C are pinned to Sunday and Wednesday respectively —
  edit the `freq: {weekday: N}` values near the top of the `<script>` block in
  `index.html` if you want to change those days (0 = Sunday ... 6 = Saturday).
- Once your 8–10 week D3 correction phase ends, delete or comment out the `d3high`
  item in the `ITEMS` array and rely on `maglycid3` (daily maintenance) instead.

## Notes

- Checklist and workout-day data live only in the browser (localStorage) —
  they don't sync across devices. The supplement list and notification times
  DO sync across devices/browsers if you've connected GitHub, since they live
  in the repo.
- This is a personal tracking tool, not medical software. Recheck the stack itself
  with a doctor periodically, especially around the Vitamin D3 phase change.

---

## Push notifications to your phone (via GitHub Actions + ntfy.sh)

A static site can't send notifications on its own — nothing runs when the page
is closed. This repo solves that with two free pieces:

- **GitHub Actions**: runs `.github/workflows/reminders.yml` every 5 minutes
  in GitHub's cloud, even while your phone is off. It checks `data/schedule.json`
  against the current time in IST, and sends whatever's due using the current
  contents of `data/items.json`. Free for this use.
- **ntfy.sh**: a free, no-signup push notification service. You pick a "topic"
  name (like a private channel), subscribe to it on your phone, and anything
  posted to that topic pops up as a notification.

### 1. Install the ntfy app
- Android: [ntfy on Google Play](https://play.google.com/store/apps/details?id=io.heckel.ntfy)
- iOS: [ntfy on the App Store](https://apps.apple.com/us/app/ntfy/id1625396347)

### 2. Pick a private topic name
Anyone who knows your topic name can send to it or read it — ntfy.sh is public,
there's no login. So pick something long and random, not `muzz-supplements`.
Example: `muzz-stack-7f3ka9x2`

In the app: tap **+ Subscribe to topic**, enter that exact string.

### 3. Add the topic as a GitHub Secret (keeps it out of your public code)
In your repo: **Settings → Secrets and variables → Actions → New repository secret**
- Name: `NTFY_TOPIC`
- Value: `muzz-stack-7f3ka9x2` (your topic string, no `ntfy.sh/` prefix)

### 4. Push everything to your repo
`index.html`, `data/items.json`, `data/schedule.json`, and
`.github/workflows/reminders.yml` all need to be pushed together — the app and
the workflow both read the `data/` files.

### 5. Test it immediately (don't wait for the schedule)
Go to your repo's **Actions** tab → **Reminders (dynamic, IST)** → **Run workflow**
→ tick **force** → confirm. This sends every notification once regardless of
the current time, so you can verify the whole pipeline works before trusting
the schedule.

### What's scheduled (edit times anytime — in the app's ⚙ Sync settings, or
directly in `data/schedule.json`; all times are IST)

| `schedule.json` key | Default | Sends |
|---|---|---|
| `morning` | 07:30 daily | Everything in the Morning section marked "daily" |
| `evening` | 20:30 daily | Everything in the Evening section marked "daily" |
| `weekly_sun` | 08:00 Sundays | Everything scheduled for Sunday |
| `weekly_wed` | 08:00 Wednesdays | Everything scheduled for Wednesday |
| `workout_pre` | 18:00 daily | Everything in the Pre-workout section |
| `workout_post` | 19:15 daily | Everything in the Post-workout section |

The pre/post-workout times fire every day by default since your gym day
varies — just ignore the notification on rest days, or change the times to
match your routine.

### Limitations to know about
- GitHub free-tier scheduled workflows can be delayed a few minutes during
  high-load periods — treat times as "around" rather than to-the-second. Set
  schedule times in 5-minute increments (the workflow checks every 5 minutes).
- Scheduled workflows pause automatically if the repo has zero activity for
  60 days. Push any small commit, or run the workflow manually once, to
  reactivate it if that happens.
- Once your D3 60,000 IU correction phase ends, delete the `d3high` entry from
  `data/items.json` (via the app's Manage Cabinet, or directly on GitHub) so
  the Sunday reminder stops mentioning it.
