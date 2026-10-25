# Deploying the platform so the laptop can be switched off

The app currently runs on your laptop, so the link dies with it. To keep a link alive while the laptop is off, the app has to run on a computer that is always on — a cloud host. This guide deploys the **same code** to a free host and gives you a permanent-style URL.

## Fastest path (recommended): Render only, no database signup

The `cloud` Spring profile runs an embedded H2 database and seeds the 27 fictional demo incidents on every start. You only need a GitHub account and a Render account.

1. **GitHub:** create a repository → **Add file → Upload files** → drag the contents of `women-safety-platform-deploy.zip` (unzipped) → Commit. The `Dockerfile` must be at the repository root.
2. **Render:** sign up with GitHub → **New → Blueprint** → pick the repository → **Apply**.
3. Render reads `render.yaml`, builds the Docker image (5–10 minutes) and gives you `https://<name>.onrender.com`.

There is nothing else to configure: the profile, demo seeder, JWT secret and memory settings are in the blueprint.

**Free-tier behaviour:** the service sleeps after ~15 minutes without visitors; the first visit afterwards takes about a minute. The filesystem is ephemeral, so a restart or redeploy resets the database and the seeder recreates the demo data. Evidence uploads are lost on restart. For a 2–3 day demo this is usually enough.

If you need the data to survive restarts, use the MySQL variant below instead.

## Persistent option: Render + db4free MySQL

| Option | Cost | Card needed | Database | Notes |
|---|---|---|---|---|
| **A. Render + db4free MySQL** | Free | No | Free MySQL 8 | Data survives restarts |
| **B. Railway + MySQL plugin** | Trial credit (~$5) | Usually yes | Managed MySQL | Faster, no sleep, easiest database |

Everything needed is already in this project: `Dockerfile`, `docker-entrypoint.sh`, `render.yaml`, and a single-container runtime that serves the React app and proxies `/api` to Spring Boot.

---

## Option A — Render + db4free (no credit card)

### A1. Create the free MySQL database (5 minutes)

1. Open <https://www.db4free.net/signup.php>.
2. Fill in:
   - **Database name**: something unique, e.g. `wssafety2026` (letters/numbers, 5+ characters).
   - **Username**: the same value is usual, e.g. `wssafety2026`.
   - **Password**: a strong password — save it.
   - **Email**: your email.
3. Confirm the email they send you.
4. Note these four values:

```
Host:     db4free.net
Port:     3306
Database: wssafety2026
Username: wssafety2026
Password: <your password>
```

db4free is a free testing service: 200 MB, databases inactive for ~30 days may be removed. That is fine for a 2-day college demo, **not** for real data.

### A2. Put the project on GitHub

1. Create a GitHub account if you do not have one.
2. Create a new repository, e.g. `women-safety-platform` (Private is fine).
3. On the repository page choose **Add file → Upload files**.
4. Upload the contents of `women-safety-platform-deploy.zip` (unzip it first, then drag the **files and folders inside** — `Dockerfile`, `backend/`, `frontend/`, `docs/`, `database/`, `README.md`, etc.).
   - Important: `Dockerfile` must be at the top level of the repository, not inside a subfolder.
5. Commit the upload.

### A3. Deploy on Render

1. Sign up at <https://render.com> with **GitHub** (no card for free web services).
2. Dashboard → **New → Blueprint**.
3. Select your repository. Render reads `render.yaml` automatically.
4. When asked, fill the secret values:

| Variable | Value |
|---|---|
| `DB_URL` | `jdbc:mysql://db4free.net:3306/wssafety2026?useSSL=true&requireSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true` |
| `DB_USERNAME` | `wssafety2026` |
| `DB_PASSWORD` | your db4free password |
| `JWT_SECRET` | click “Generate” (or any 32+ random characters) |

Leave the other values as they are (`SEED_ENABLED=true`, `EVIDENCE_DIR=/tmp/evidence`, `DB_POOL_SIZE=4`).

5. Click **Apply** and wait for the build (5–10 minutes the first time).
6. Open the URL shown at the top, e.g. `https://women-safety.onrender.com`.

### A4. Check it

1. The landing page loads.
2. Log in as `admin@demo.local` / `Demo@12345`.
3. The dashboard should show 27 incidents, 2 today, 1 active SOS, 2 hotspots (created by the seeder on first boot).

**If the page shows “Backend unavailable”**, open Render → Logs and check the database connection. A wrong password or a database that has not been activated yet is the usual cause.

### A5. Free-tier behaviour

- The service **sleeps after ~15 minutes of no traffic**. The first visit afterwards takes about a minute to wake; after that it is fast.
- Files uploaded as evidence live in `/tmp` and are lost when the service restarts or redeploys. Database rows persist.
- The URL (`https://<name>.onrender.com`) stays the same. You can add a custom domain later.

---

## Option B — Railway + managed MySQL (faster, needs trial)

1. Sign up at <https://railway.app> with GitHub (the trial credit normally requires a card).
2. **New Project → Deploy from GitHub repo** → choose your repository. Railway detects the `Dockerfile`.
3. In the same project: **New → Database → MySQL**.
4. Open the web service → **Variables** and add:

```
DB_URL      = jdbc:mysql://${{MySQL.MYSQLHOST}}:${{MySQL.MYSQLPORT}}/${{MySQL.MYSQLDATABASE}}?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=UTF-8
DB_USERNAME = ${{MySQL.MYSQLUSER}}
DB_PASSWORD = ${{MySQL.MYSQLPASSWORD}}
JWT_SECRET  = <32+ random characters>
SEED_ENABLED = true
DB_POOL_SIZE = 4
JAVA_TOOL_OPTIONS = -Xmx256m -XX:MaxMetaspaceSize=160m
EVIDENCE_DIR = /tmp/evidence
```

5. **Settings → Networking → Generate Domain**.
6. Open the domain; the first boot runs Flyway and the demo seeder.

---

## Option C — your own VPS (if you have one)

```bash
git clone <your repository>
cd women-safety-platform
docker build -t women-safety .
docker run -d --name women-safety -p 80:8080 \
  -e DB_URL="jdbc:mysql://<host>:3306/<db>?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC" \
  -e DB_USERNAME="<user>" -e DB_PASSWORD="<password>" \
  -e JWT_SECRET="<32+ chars>" -e SEED_ENABLED=true \
  -e EVIDENCE_DIR=/data/evidence -v /srv/women-safety/evidence:/data/evidence \
  women-safety
```

Point a domain at the server, or use `http://<server-ip>/`.

### Keep the free Render service awake (optional)

Render free services sleep after ~15 minutes without traffic. For a demo day, create a free monitor at <https://cron-job.org>:

- URL: `https://<your-service>.onrender.com/`
- Interval: every 10 minutes

That keeps the service warm so visitors do not wait for a cold start. One free service uses about 744 instance-hours per month, which fits Render's free monthly allowance — but check your own dashboard limits.

---

## How the container works

```
Browser ──HTTPS──> Node static server ($PORT)
                     ├─ /            → React build (dist)
                     └─ /api/*       → Spring Boot on 127.0.0.1:8080
Spring Boot ──JDBC──> MySQL (external)
```

- One origin, so no CORS configuration is required.
- `docker-entrypoint.sh` starts the jar and the static server, and restarts the container if either dies.
- Flyway creates the schema on first boot; `SEED_ENABLED=true` inserts the fictional demo data only when the database is empty.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Build fails on `npm install` | Peer dependency conflict | The Dockerfile already uses `--legacy-peer-deps`; make sure you uploaded `frontend/package.json` and `frontend/package-lock.json` |
| “Backend unavailable” | API failed to start or DB unreachable | Render/Railway logs → look for `Communications link failure` or `Access denied` |
| `Schema-validation: missing table` | Flyway did not run | Check `DB_URL` points at the intended database and the user may create tables |
| Service exits with code 137 | Out of memory | Keep `JAVA_TOOL_OPTIONS=-Xmx256m`; use a larger plan if needed |
| Login says invalid credentials | Seeder did not run | `SEED_ENABLED=true` and the database must be empty on first boot |
| First request very slow | Render free tier slept | Wait ~60 seconds and reload |

## Before you share the link

- Change `DEMO_PASSWORD` (or delete the demo accounts) if the link is public.
- Keep `JWT_SECRET` private.
- Do not upload real incident data or real evidence to a free host.
- This remains a college prototype, not an emergency service.

## What I can and cannot do for you

I cannot create GitHub/Render/Railway accounts on your behalf (they need your email and verification). Everything else is prepared: the container image definition, the Render blueprint, environment values and this guide.

If you create the accounts and give me the repository URL (and, if you prefer, add me as a collaborator), I can walk you through each screen or debug the deploy log with you.
