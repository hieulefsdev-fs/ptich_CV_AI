#!/bin/bash
# Deploy CV AI (devforge.io.vn) - duoc goi boi GitHub Actions qua SSH (forced command)
set -euo pipefail
cd "$(dirname "$0")"

echo "==> [1/5] Pull code moi tu GitHub"
git pull --ff-only origin main
echo "Commit hien tai: $(git log --oneline -1)"

echo "==> [2/5] Build image moi (container cu van dang chay)"
docker compose build

echo "==> [3/5] Cap nhat stack"
docker compose up -d

echo "==> [4/5] Don image cu"
docker image prune -f

echo "==> [5/5] Verify sau deploy"
sleep 10
docker compose ps

status="none"
for i in $(seq 1 18); do
  status=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' cvai_backend)
  echo "backend health: $status (lan $i)"
  [ "$status" = "healthy" ] || [ "$status" = "none" ] && break
  sleep 5
done
if [ "$status" != "healthy" ] && [ "$status" != "none" ]; then
  echo "LOI: backend khong healthy"
  docker compose logs --tail=50 backend
  exit 1
fi

FRONTEND_PORT=$(grep -E '^FRONTEND_PORT=' .env | cut -d= -f2 | tr -d '"\r')
code=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${FRONTEND_PORT}/")
echo "frontend http://127.0.0.1:${FRONTEND_PORT}/ -> HTTP $code"
if [ "$code" != "200" ]; then
  echo "LOI: frontend khong tra 200"
  docker compose logs --tail=50 frontend
  exit 1
fi

echo "DEPLOY OK"