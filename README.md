# Marketing Forecast App

Internal dashboard hosting the marketing budget forecaster for iGaming client pitches. The app is the single-file `marketing-forecast-v37.html` (originally in the working folder, now `public/index.html` here) wrapped in a thin Express server for IP-allowlist gating and deployed to Cloud Run.

> **Stack note.** The other Receptional Dashboards in this folder (Lotto Max, AI Visibility, Organic Performance) use Observable Framework because they need live data loaders. The forecast app is fully client-side (Chart.js and SheetJS from CDN), so Framework added build-time complexity without any runtime benefit. This project skips Framework entirely and serves `public/index.html` byte-identical to the standalone file. The Cloud Run / IP-allowlist / repo conventions from `../CLAUDE.md` still apply.

> **Phase 1 (current).** Port v37 behind the IP gate so it's reachable on a stable URL. The existing in-app JSON export/import remains the way to save and load forecasts.
>
> **Phase 2 (next).** Replace JSON export/import with a multi-forecast manager: server-side named saves backed by GCS, `/api/forecasts` endpoints, and a Forecasts dropdown in the app's toolbar. Adding endpoints to `server.js` is straightforward; no build step changes.

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

## Deploying to Cloud Run

The dashboard runs as Cloud Run service `marketing-forecast-app` in `client-monthly-report-mcp` / `europe-west2`. The runtime service account `marketing-forecast-app@client-monthly-report-mcp.iam.gserviceaccount.com` already exists (it has no roles in Phase 1; Phase 2 will add Storage Object Admin on a forecasts bucket).

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
  --update-env-vars "ALLOWED_IPS=185.121.137.248" `
  --update-labels "git-sha=$(git rev-parse --short HEAD)"
```

Takes 1–2 minutes (no Framework build, just a small image). Cloud Build runs in the cloud.

### Updating the allowlist

```powershell
gcloud run services update marketing-forecast-app `
  --region europe-west2 `
  --update-env-vars "^|^ALLOWED_IPS=185.121.137.248,203.0.113.5"
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
├─ server.js                # IP allowlist + static serve of public/
├─ docs/                    # CHANGELOG / spec / sample forecast JSON — not shipped
└─ public/
   └─ index.html            # The forecast app (marketing-forecast-v37.html)
```

## Updating to a newer v37+ snapshot

When you ship a new version of the forecast HTML from the working folder, drop the new file in:

```sh
cp ".../forecast app/marketing-forecast-vNN.html" public/index.html
```

Then commit, push, and redeploy with the block above. The file replaces the previous one — no version-specific paths, no script changes.
