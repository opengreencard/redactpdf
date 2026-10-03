#!/usr/bin/env bash
# Cursor Cloud Agent start.
#
# Docker is not supervised by systemd in this VM. On each boot this starts
# dockerd, MariaDB from docker-compose.yml, syncs tables, then leaves
# `yarn dev` in the foreground. Safe to run again.
set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "$DIR/.." && pwd )"

# /exec-daemon/node is Node 22. This app requires Node 26 in /usr/local.
export PATH="/usr/local/bin:${PATH}"
cd "$REPO_ROOT"

# bash -l does not refresh group membership, so the docker group on the
# socket is not reliable. Passwordless sudo is available in this image.
if ! sudo docker info >/dev/null 2>&1; then
  # fuse-overlayfs is set in /etc/docker/daemon.json because the VM root
  # is already overlayfs, so Docker's default overlay2 driver cannot nest.
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
