#!/usr/bin/env bash
# Cursor Cloud Agent start.
#
# Starts Docker, MariaDB from docker-compose.yml, then `yarn dev`.
# Safe to run again.
set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR/.."

# The VM also has Node 22 on PATH. This app needs Node 26.
export PATH="/usr/local/bin:${PATH}"

# bash -l does not pick up the docker group, and systemd is not running.
# fuse-overlayfs is set in /etc/docker/daemon.json because the VM root is
# already overlayfs, so Docker's usual overlay2 driver cannot nest.
if ! sudo docker info >/dev/null 2>&1; then
  sudo bash -c 'nohup dockerd >/var/log/dockerd.log 2>&1 &'
fi

ready=0
for _ in $(seq 1 60); do
  if sudo docker info >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done
if [ "$ready" -ne 1 ]; then
  echo 'Docker did not become ready. See /var/log/dockerd.log' >&2
  exit 1
fi

sudo docker compose --env-file .env.development up -d --wait mariadb

# Creates missing tables. Safe to repeat; it does not alter existing columns.
yarn init-db-dev

if curl -sf -o /dev/null --max-time 3 http://127.0.0.1:3000/; then
  echo 'Next.js is already listening on port 3000'
  exit 0
fi

exec yarn dev --hostname 0.0.0.0 --port 3000
