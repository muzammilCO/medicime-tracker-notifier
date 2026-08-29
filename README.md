# The Stack — Daily Supplement Tracker

A tracker for your daily/weekly/workout-day supplement stack, with history,
an editable cabinet, and phone push notifications that stay in sync across
every device you use it from.

## Repo structure

```
supplement-tracker/
├── index.html                       ← the app itself
├── README.md
├── data/
│   ├── items.json                   ← your supplement list (source of truth)
│   ├── schedule.json                ← notification times, in IST
│   └── logs.json                    ← check-off / workout-day history
├── .github/
│   └── workflows/
│       └── reminders.yml            ← sends phone notifications, every 5 min
└── cloudflare-worker/
    └── worker.js                    ← sync proxy — keeps your GitHub token
                                        off the browser (see setup below)
```

`index.html` and `data/*.json` get deployed together via **GitHub Pages**.
`cloudflare-worker/worker.js` gets deployed separately on **Cloudflare
Workers** (free) — it's what lets the app sync without you pasting a long
GitHub token into every device.

---

## Part 1 — Deploy the site (GitHub Pages)

1. Create a GitHub repo, e.g. `supplement-tracker`.
2. Push everything **except** the `cloudflare-worker/` folder to it, keeping
   the folder structure above:
   ```bash
   cd supplement-tracker
   git init
   git add index.html README.md data/ .github/
   git commit -m "Supplement tracker"
   git branch -M main
   git remote add origin https://github.com/<you>/supplement-tracker.git
   git push -u origin main
   ```
3. In the repo: **Settings → Pages → Build and deployment → Source →
   Deploy from a branch** → branch `main`, folder `/ (root)` → **Save**.
4. GitHub gives you a live URL in a minute or two:
   `https://<you>.github.io/supplement-tracker/`

Open it on your phone and use **"Add to Home Screen"** so it behaves like an app.

---

## Part 2 — Phone push notifications (GitHub Actions + ntfy.sh)

`.github/workflows/reminders.yml` runs every 5 minutes in GitHub's cloud and
checks `data/schedule.json` against the current time **in IST** — no UTC
math anywhere. It builds each notification's text live from `data/items.json`,
so editing your supplement list automatically changes what the notification
says, with nothing to redeploy.

1. Install the **ntfy** app: [Android](https://play.google.com/store/apps/details?id=io.heckel.ntfy) · [iOS](https://apps.apple.com/us/app/ntfy/id1625396347)
2. Pick a long, random **topic name** nobody would guess — ntfy.sh has no
   login, so anyone who knows the topic can read or post to it. Example:
   `muzz-stack-7f3ka9x2`. Subscribe to it in the app.
3. In your repo: **Settings → Secrets and variables → Actions → New repository
   secret** → name `NTFY_TOPIC`, value your topic string.
4. Test it: **Actions tab → "Reminders (dynamic, IST)" → Run workflow** → tick
   **force** → confirm. You should get every notification once, immediately,
   regardless of the actual time — this proves the pipeline works before you
   trust the schedule.

### What's scheduled, and how to change it

All of this can be edited **live**, either through the app's ⚙ **Sync
settings** panel (see Part 3) or by editing the JSON files directly on
GitHub — no workflow file editing, ever.

| `schedule.json` key | Default | Fires |
|---|---|---|
| `morning` | 07:30 daily | Everything in Morning marked "daily" |
| `evening` | 20:30 daily | Everything in Evening marked "daily" |
| `workout_pre` | 18:00 daily | Everything in Pre-workout |
| `workout_post` | 19:15 daily | Everything in Post-workout |
| `weekly.<0-6>` | `weekly.0` = 08:00, `weekly.3` = 08:00 | Everything scheduled for that weekday (0 = Sunday ... 6 = Saturday) |

**Changing a time takes effect on the very next 5-minute check** — if you move
the pre-workout notification from 11:00 to 17:00, you'll simply stop getting
it at 11:00 and start getting it at 17:00, because the workflow re-reads
`schedule.json` fresh every single run. Nothing needs redeploying.

The pre/post-workout notifications fire daily by default since your gym day
varies — ignore them on rest days, or change the times to match your routine.

**Weekly items** — in the app's Sync settings, the "Weekly item" picker lists
every supplement you've scheduled weekly, auto-shows which day it's on (taken
from that item's own schedule in Manage Cabinet), and lets you set what time
that day's notification fires. Multiple items on the same weekday share one
notification and one time.

### Limitations to know about
- GitHub's free scheduled workflows can run late — sometimes by a lot during
  high-load periods (top of the hour, midnight UTC). This workflow now
  **catches up automatically**: each reminder stays "due" for 90 minutes past
  its target time, and a marker in `data/logs.json` stops it firing twice if
  GitHub runs the workflow more than once inside that window. You should get
  every notification once, even if GitHub is running late — just not always
  to-the-minute.
- A brand-new or freshly-edited schedule can take 15 minutes to over an hour
  before GitHub "recognizes" it and starts firing automatically. If nothing's
  happened after that, push any small commit to the default branch — this is
  GitHub's own documented fix for stuck schedules.
- Scheduled workflows pause after 60 days of zero repo activity. Push any
  small commit, or run the workflow manually once, to wake it back up.
- Once your D3 60,000 IU correction phase ends, delete the `d3high` entry
  from `data/items.json` (Manage Cabinet, or directly on GitHub) so the
  weekly reminder stops mentioning it.

---

## Part 3 — Cross-device sync, without pasting a long token everywhere

### The short version
A GitHub **Secret** can only ever be read by GitHub Actions — never by a
public webpage, by design. So there's no way for the browser itself to "use
a Secret." What actually solves your problem — a long token you don't want
to keep re-entering — is moving that token off the browser entirely.

**The fix:** a tiny free proxy (Cloudflare Worker) holds your real GitHub
token as a server-side secret. Your browser only ever needs the Worker's URL
and a short PIN you make up — something you can type in a few seconds, and
only once per device, not once per session.

| | Where it lives | How long it is |
|---|---|---|
| GitHub token (real credential) | Cloudflare Worker secret, server-side only | Long, entered once, ever |
| Sync PIN (what your browser uses) | This browser's local storage | Short, your choice, e.g. `482913` |

### Setting up the Worker (one-time, ~5 minutes)

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → sign up free if
   you don't have an account.
2. **Workers & Pages → Create → Create Worker.** Give it any name, e.g.
   `supplement-sync`. Deploy the default template first.
3. Click **Edit code** (Quick Edit). Delete the placeholder code and paste in
   the contents of `cloudflare-worker/worker.js` from this repo. Click **Save
   and deploy**.
4. Back on the Worker's page, go to **Settings → Variables and Secrets → Add**.
   Add these five, each marked as a **Secret** (encrypted):
   - `GITHUB_TOKEN` — a GitHub fine-grained PAT. Create one at GitHub →
     Settings → Developer settings → Fine-grained tokens → scope it to
     **only this repository**, permission **Contents: Read and write**.
     This is the one place the long token gets pasted — ever.
   - `GITHUB_OWNER` — your GitHub username, e.g. `muzz123`
   - `GITHUB_REPO` — the repo name, e.g. `supplement-tracker`
   - `GITHUB_BRANCH` — usually `main`
   - `SYNC_PIN` — make up a short string, e.g. `482913`. This is what you'll
     type into the app on each device.
5. Save. Your Worker now has a public URL like
   `https://supplement-sync.<your-cloudflare-name>.workers.dev` — copy it.

### Connecting each device to the Worker

1. Open the app, tap **⚙ Sync settings**.
2. Paste the **Worker URL** and your **Sync PIN**.
3. Do this once per device (phone, laptop, etc.) — after that, cabinet edits,
   schedule changes, and daily check-offs on that device all sync through the
   Worker to your repo, and any other connected device picks up the same data.

Nothing sensitive sits in the browser beyond a short PIN you chose yourself —
losing or exposing it only lets someone commit to this one repo's `data/`
files, and only if they also have your Worker URL. The Worker also refuses
to write anywhere outside `data/*.json`, even with a valid PIN.

---

## Notes

- **What syncs:** supplements, notification times, and check-off/workout-day
  history — as long as a device has the Worker URL + PIN configured.
  Without that, a device only saves locally to its own browser.
- Check-off history syncs a couple of seconds after your last tap (not on
  every single tap), and merges day-by-day if two devices log around the
  same time, rather than one overwriting the other.
- This is a personal tracking tool, not medical software. Recheck the stack
  itself with a doctor periodically, especially around the Vitamin D3 phase
  change.
