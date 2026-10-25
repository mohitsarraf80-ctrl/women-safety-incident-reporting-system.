# Women Safety Incident Reporting Platform - single-container deployment image
#
# The image contains:
#   - the Spring Boot API (port 8080, internal only)
#   - the built React app served by a small Node server on $PORT
#   - a server-side /api proxy, so the browser only talks to one origin (no CORS)
#
# Required environment variables at runtime:
#   DB_URL, DB_USERNAME, DB_PASSWORD      MySQL connection
#   JWT_SECRET                            at least 32 characters
#   SEED_ENABLED=true                     creates the fictional demo dataset on first boot
# Optional:
#   EVIDENCE_DIR, DEMO_PASSWORD, DISPLAY_TIME_ZONE, CORS_ALLOWED_ORIGINS

# ---------- 1. Build the React app ----------
FROM node:22-bookworm-slim AS frontend-build
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install --legacy-peer-deps --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# ---------- 2. Build the Spring Boot jar ----------
FROM maven:3.9-eclipse-temurin-17 AS backend-build
WORKDIR /build
COPY backend/pom.xml ./
RUN mvn -B -q -DskipTests dependency:go-offline
COPY backend/src ./src
RUN mvn -B -q -DskipTests package

# ---------- 3. Runtime ----------
FROM node:22-bookworm-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends openjdk-17-jre-headless \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=backend-build /build/target/women-safety-backend-1.0.0.jar /app/app.jar
COPY --from=frontend-build /build/dist /app/dist
COPY frontend/server/serve-dist.mjs /app/server/serve-dist.mjs
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

ENV SERVER_PORT=8080 \
    EVIDENCE_DIR=/tmp/evidence \
    NODE_ENV=production

EXPOSE 8080
ENTRYPOINT ["/app/docker-entrypoint.sh"]
