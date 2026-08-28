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

## How it works

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

- Data lives only in the browser it was checked in — it won't sync across devices
  unless you deploy the same page and manually re-check items on each device.
- This is a personal tracking tool, not medical software. Recheck the stack itself
  with a doctor periodically, especially around the Vitamin D3 phase change.

---

## Push notifications to your phone (via GitHub Actions + ntfy.sh)

A static site can't send notifications on its own — nothing runs when the page is
closed. This repo solves that with two free pieces:

- **GitHub Actions**: runs on a schedule in GitHub's cloud, even while your
  laptop/phone is off. Free for this use (a few seconds of runtime, a few times a day).
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

### 4. Push the `.github/workflows/` folder
It's already included in this download — just push it to the repo along with
`index.html`. GitHub will automatically pick up the schedules once it's on `main`.

### 5. Test it immediately (don't wait for the schedule)
Go to your repo's **Actions** tab → pick any workflow (e.g. "Reminder - Morning stack")
→ **Run workflow** button → confirm. You should get a phone notification within
a few seconds if the topic is set up correctly.

### What's scheduled (all times IST, edit the `cron:` lines to change them)

| Workflow file | Fires | Notification |
|---|---|---|
| `reminder-morning.yml` | 7:30 AM daily | Multivitamin, B-complex, Shilajit |
| `reminder-evening.yml` | 8:30 PM daily | Calcium combo, Omega-3, Maglyci-D3 |
| `reminder-vitamin-d3.yml` | 8:00 AM, Sundays | Vitamin D3 60,000 IU |
| `reminder-vitamin-c.yml` | 8:00 AM, Wednesdays | Vitamin C 500mg |
| `reminder-workout.yml` | 6:00 PM & 7:15 PM daily | Pre/post-workout (L-Arginine, Protein+Creatine) — edit or delete this one if your gym time doesn't match, since it fires daily regardless of whether it's actually a workout day |

Cron times in GitHub Actions are always UTC. IST is UTC+5:30, so subtract 5:30
from the IST time you want to get the UTC value for the `cron:` line.

### Limitations to know about
- GitHub free-tier scheduled workflows can be delayed a few minutes during
  high-load periods — treat times as "around" rather than to-the-second.
- Scheduled workflows on GitHub pause automatically if the repo has zero
  activity for 60 days. Just push any small commit (or manually run a workflow
  once) to keep them active if that happens.
- Once your D3 60,000 IU correction phase ends, delete or disable
  `reminder-vitamin-d3.yml` (rename it to end in `.yml.disabled`, or delete it).
