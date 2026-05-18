# Marketing Forecast App

Internal dashboard hosting the marketing budget forecaster for iGaming client pitches. Originally a standalone HTML file (`marketing-forecast-v37.html` in the working folder), ported into the Receptional Dashboards stack so it's reachable on a stable URL, gated by IP, and deployable via the same Cloud Run pipeline as the other dashboards.

Single page at `/`. The app is fully client-side — total annual budget → vertical → channel → platform → monthly phasing — with Chart.js and SheetJS loaded from CDN. No live data sources.

Built on [Observable Framework](https://observablehq.com/framework/) (static site) wrapped in an [Express](https://expressjs.com/) server (`server.js`) that gates all requests with an IP allowlist (Cloud Run XFF-aware; CIDR supported via `ipaddr.js`).

> **Phase 1.** This release ports the v37 HTML behind the dashboard infrastructure. The existing JSON export/import remains the way to save and load forecasts. **Phase 2** (planned next) replaces JSON export/import with a multi-forecast manager: server-side named saves backed by GCS, with `/api/forecasts` endpoints and a Forecasts dropdown in the app's toolbar.

---

## Local development

### Fast iteration (Observable Framework dev server)

Best for working on the layout or styles:

```sh
npm install
npm run dev
```

Visit <http://localhost:3000>. Hot reload on every file save.

### Production server, locally (Node)

Best for testing the Express layer:

```sh
npm install
npm run build
node server.js
```

Visit <http://localhost:8080>.

### Production server in a container (Docker)

Mirrors what runs on Cloud Run. Useful as a final smoke test before deploying:

```sh
docker build -t marketing-forecast-app .
docker run --rm -p 8080:8080 marketing-forecast-app
```

---

## Deploying to Cloud Run

The dashboard runs as a Cloud Run service named `marketing-forecast-app` in the `client-monthly-report-mcp` GCP project, region `europe-west2`. Build + deploy is a single `gcloud` command.

> **Always follow the deployment process** — commit + push before deploy, stamp the revision with the commit SHA, fast-forward `main` after a verified deploy. The reasoning lives in [../CLAUDE.md](../CLAUDE.md); the specific commands below already include the SHA stamp.

### Prerequisites (one-time)

1. **gcloud CLI** installed and signed in: `gcloud auth login`
2. **Project set**: `gcloud config set project client-monthly-report-mcp`
3. **APIs enabled** (already done for the other dashboards; here for reference if rebuilding from scratch):
   ```sh
   gcloud services enable \
     run.googleapis.com \
     cloudbuild.googleapis.com \
     artifactregistry.googleapis.com
   ```
4. **Runtime service account** — create a per-service identity. No project-level roles required in Phase 1 (the app makes no GCP API calls); Phase 2 will add Storage Object Admin on a forecasts bucket.
   ```sh
   gcloud iam service-accounts create marketing-forecast-app \
     --display-name="Marketing Forecast App runtime"
   ```
5. **Decide the allowlist.** Default matches the AI Visibility / Lotto Max dashboards — the Receptional VPN's dedicated egress (`185.121.137.248`). To add an office IP or CIDR, append entries as `ALLOWED_IPS=185.121.137.248,203.0.113.0/29` etc.

### Deploying a new revision

After any code change. Commit and push first (see [the deployment process](../CLAUDE.md#deployment-process--always-follow-this)), then from this folder:

```powershell
# Sanity check: working tree clean, branch pushed
git status   # should show "nothing to commit, working tree clean"
git push     # ensure origin matches local

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

# Fast-forward main if you were on a feature branch:
git switch main && git merge --ff-only <feature-branch> && git push origin main
```

Takes 2–4 minutes. Zero-downtime — the new revision replaces the old only after it's healthy.

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
├─ Dockerfile               # Two-stage build → slim runtime image
├─ .dockerignore            # Excludes node_modules, dist, .git, docs, etc.
├─ observablehq.config.js   # Observable Framework config
├─ package.json
├─ server.js                # Express server: IP allowlist + static dist/
├─ scripts/
│  └─ build-index-md.mjs    # One-shot port script (reads the original HTML
│                           # and writes src/index.md). Kept for reference.
├─ docs/                    # CHANGELOG / spec / sample forecast JSON — not shipped
└─ src/
   └─ index.md              # The forecast app (markup + styles + JS, ported from v37)
```

## Command reference

| Command                                | Description                                              |
| -------------------------------------- | -------------------------------------------------------- |
| `npm install`                          | Install dependencies                                     |
| `npm run dev`                          | Observable Framework dev server (port 3000)              |
| `npm run build`                        | Build the static site into `./dist`                      |
| `node server.js`                       | Run the production Express server locally (port 8080)   |
| `npm run clean`                        | Clear the local data-loader cache                        |
| `docker build -t marketing-forecast-app .` | Build the container image                            |
| `gcloud run deploy ...`                | Deploy to Cloud Run (see Deploying section above)        |
