#!/bin/sh
# Starts the Spring Boot API in the background and the static React server in the
# foreground. The platform gives us $PORT (Render/Railway); the API stays on 8080.
set -eu

API_PORT=8080
PUBLIC_PORT="${PORT:-4173}"

echo "Starting API on ${API_PORT} and web app on ${PUBLIC_PORT}"
java -jar /app/app.jar --server.port="${API_PORT}" &

API_PID=$!

# The static server proxies /api/* to API_TARGET.
export API_TARGET="http://127.0.0.1:${API_PORT}"
export PORT="${PUBLIC_PORT}"
node /app/server/serve-dist.mjs &

WEB_PID=$!

# Exit if either process dies so the platform can restart the container.
while kill -0 "${API_PID}" 2>/dev/null && kill -0 "${WEB_PID}" 2>/dev/null; do
  sleep 5
done

echo "One of the processes stopped; shutting down."
kill "${API_PID}" "${WEB_PID}" 2>/dev/null || true
exit 1
