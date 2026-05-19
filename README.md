# Marketing Forecast App

Internal dashboard hosting the marketing budget forecaster for iGaming client pitches. The app is the single-file `marketing-forecast-v37.html` (originally in the working folder, now `public/index.html` here) wrapped in a thin Express server for IP-allowlist gating and deployed to Cloud Run.

> **Stack note.** The other Receptional Dashboards in this folder (Lotto Max, AI Visibility, Organic Performance) use Observable Framework because they need live data loaders. The forecast app is fully client-side (Chart.js and SheetJS from CDN), so Framework added build-time complexity without any runtime benefit. This project skips Framework entirely and serves `public/index.html` byte-identical to the standalone file. The Cloud Run / IP-allowlist / repo conventions from `../CLAUDE.md` still apply.

**Forecast manager (Phase 2).** Adds a **📁 Forecasts ▾** dropdown to the toolbar that lets the team save, load, rename, and delete named forecasts — replacing the JSON export/import as the primary save mechanism. Backed by GCS; one object per forecast at `forecasts/<id>.json` in `FORECASTS_BUCKET`. The existing **📤 Download JSON** / **📥 Upload JSON** buttons stay as a manual file backup.

The Forecasts UI is provided by `public/forecasts-manager.js`, which the server injects at runtime via a `<script>` tag and relabels the legacy v37 toolbar buttons (`💾 Save → 📤 Download JSON`, `📂 Load → 📥 Upload JSON`). Future v38+ snapshots drop into `public/index.html` and pick up the feature without any HTML edits.

---

## Local development

```sh
npm install
node server.js
```

Visit <http://localhost:8080>. Edit `public/index.html`, refresh — no build step, no hot reload server, no framework. If you want hot reload, the simplest path is to open `public/index.html` directly in the browser (it's self-contained) and only switch to the Express server when you want to test the IP allowlist or the upcoming API endpoints.

### Docker (smoke test before deploy)

```sh
docker build -t marketing-forecast-app .
docker run --rm -p 8080:8080 marketing-forecast-app
```

Mirrors what runs on Cloud Run.

---

## One-time GCS setup for the Forecasts manager

The Forecasts dropdown needs a bucket to write to and an IAM grant on the runtime service account. Do these once; the deploy block below references `FORECASTS_BUCKET=marketing-forecast-app-state`.

```powershell
# 1. Bucket. Globally unique name — if taken, add a suffix and update
#    FORECASTS_BUCKET on deploy to match.
gcloud storage buckets create gs://marketing-forecast-app-state `
  --location=europe-west2 `
  --uniform-bucket-level-access

# 2. 90-day lifecycle rule. Each save replaces the object, which resets
#    the creation time — so a forecast lives indefinitely as long as
#    someone touches it within 90 days. Truly stale ones get cleaned up.
@'
{
  "lifecycle": {
    "rule": [
      { "action": {"type": "Delete"}, "condition": {"age": 90} }
    ]
  }
}
'@ | Out-File -Encoding utf8 lifecycle.json

gcloud storage buckets update gs://marketing-forecast-app-state `
  --lifecycle-file=lifecycle.json
Remove-Item lifecycle.json

# 3. Grant the runtime service account read/write on this bucket only.
gcloud storage buckets add-iam-policy-binding gs://marketing-forecast-app-state `
  --member="serviceAccount:marketing-forecast-app@client-monthly-report-mcp.iam.gserviceaccount.com" `
  --role="roles/storage.objectAdmin"
```

Cost is effectively zero (one tiny JSON per save, <$0.05/month even with thousands of forecasts). If you ever want to disable the feature, unset `FORECASTS_BUCKET` on the next deploy — the endpoints will return 503 and the UI surfaces "shared forecasts unavailable" while the rest of the app keeps working.

---

## Deploying to Cloud Run

The dashboard runs as Cloud Run service `marketing-forecast-app` in `client-monthly-report-mcp` / `europe-west2`. The runtime service account `marketing-forecast-app@client-monthly-report-mcp.iam.gserviceaccount.com` already exists.

> **Always follow the deployment process** — commit + push before deploy, stamp the revision with the commit SHA. The reasoning lives in [../CLAUDE.md](../CLAUDE.md); the command below already includes the SHA stamp.

```powershell
git status   # must be clean
git push     # origin must match local

gcloud run deploy marketing-forecast-app `
  --source . `
  --region europe-west2 `
  --service-account marketing-forecast-app@client-monthly-report-mcp.iam.gserviceaccount.com `
  --allow-unauthenticated `
  --memory 512Mi `
  --cpu 1 `
  --min-instances 0 `
  --max-instances 2 `
  --update-env-vars "^|^ALLOWED_IPS=185.121.137.248,94.30.113.47|FORECASTS_BUCKET=marketing-forecast-app-state" `
  --update-labels "git-sha=$(git rev-parse --short HEAD)"
```

Takes 1–2 minutes (no Framework build, just a small image). Cloud Build runs in the cloud.

The `^|^` prefix tells gcloud to use `|` as the env-var separator instead of `,` so commas inside `ALLOWED_IPS` aren't mis-parsed as flag delimiters.

### Updating the allowlist

```powershell
gcloud run services update marketing-forecast-app `
  --region europe-west2 `
  --update-env-vars "^|^ALLOWED_IPS=185.121.137.248,94.30.113.47,203.0.113.5"
```

### Logs

```sh
gcloud run services logs tail marketing-forecast-app --region europe-west2
```

### Rolling back

```sh
gcloud run revisions list --service marketing-forecast-app --region europe-west2
gcloud run services update-traffic marketing-forecast-app \
  --region europe-west2 \
  --to-revisions=<previous-revision>=100
```

---

## Project structure

```
.
├─ Dockerfile               # Single-stage: just Node + express + the static file
├─ .dockerignore
├─ package.json
├─ server.js                # IP allowlist + /api/forecasts CRUD + static serve
├─ docs/                    # CHANGELOG / spec / sample forecast JSON — not shipped
└─ public/
   ├─ index.html            # The forecast app (marketing-forecast-v37.html)
   └─ forecasts-manager.js  # Forecasts dropdown UI; injected by server at runtime
```

## Updating to a newer v37+ snapshot

When you ship a new version of the forecast HTML from the working folder, drop the new file in:

```sh
cp ".../forecast app/marketing-forecast-vNN.html" public/index.html
```

Then commit, push, and redeploy with the block above. The file replaces the previous one — no version-specific paths, no script changes.
