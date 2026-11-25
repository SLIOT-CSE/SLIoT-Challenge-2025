#!/usr/bin/env bash
# Laptop rehearsal against the real R2 bucket, under rehearsal/ only (WSL or Linux; no root).
# It never pings healthchecks.io. Use a freshly seeded database, never one with real details.
#
#   bash deploy/backup/rehearse.sh setup          make ~/sliot-rehearsal and an age key pair
#   (then put the R2 token and account ID into ~/sliot-rehearsal/rclone.conf)
#   bash deploy/backup/rehearse.sh run TEST.db    back up both ways, restore both, compare

set -Eeuo pipefail
umask 077

here="$(cd "$(dirname "$0")" && pwd)"
home="${SLIOT_REHEARSAL_DIR:-$HOME/sliot-rehearsal}"
bucket="sliot-backups"

log() { echo "rehearse: $*"; }
die() { echo "rehearse: ERROR: $*" >&2; exit 1; }

for tool in sqlite3 age age-keygen rclone litestream; do
  command -v "$tool" >/dev/null || die "$tool isn't installed"
done

case "${1:-}" in
  setup)
    mkdir -p "$home"
    chmod 700 "$home"
    [ -f "$home/rclone.conf" ] || install -m 600 "$here/rclone.conf.example" "$home/rclone.conf"
    [ -f "$home/age-key.txt" ] || age-keygen -o "$home/age-key.txt" 2>/dev/null
    chmod 600 "$home/age-key.txt"
    log "folder: $home"
    log "age public key (goes in the server's backup.env): $(age-keygen -y "$home/age-key.txt")"
    log "1. Save the whole of $home/age-key.txt in the password manager."
    log "2. Fill in access_key_id, secret_access_key and ACCOUNT_ID in $home/rclone.conf"
    ;;
  run)
    [ "$#" -eq 2 ] && [ -f "$2" ] || die "usage: rehearse.sh run TEST.db"
    [ -f "$home/rclone.conf" ] && [ -f "$home/age-key.txt" ] || die "run setup first"

    # Values from the [r2] section of rclone.conf, so the keys are typed once
    setting() { sed -n "s/^[[:space:]]*$1[[:space:]]*=[[:space:]]*//p" "$home/rclone.conf" | head -n 1 | tr -d '\r'; }
    access="$(setting access_key_id)"
    secret="$(setting secret_access_key)"
    endpoint="$(setting endpoint)"
    endpoint="${endpoint#https://}"
    [ -n "$access" ] && [ -n "$secret" ] || die "the R2 keys are missing from $home/rclone.conf"
    [[ "$endpoint" != ACCOUNT_ID.* ]] || die "replace ACCOUNT_ID in $home/rclone.conf"

    stamp="$(date -u +%Y%m%dT%H%M%SZ)"
    work="$home/run-$stamp"
    mkdir -p "$work/data"
    # A copy inside Linux: SQLite's WAL files don't work reliably on /mnt/c or /mnt/d
    db="$work/data/sliot.db"
    sqlite3 "$2" ".backup '$db'"
    sqlite3 "$db" "PRAGMA journal_mode = WAL;" >/dev/null
    expected="$(sqlite3 "$db" 'SELECT count(*) FROM teams;')"
    log "test database: $expected teams"

    cat >"$work/backup.env" <<EOF
DATABASE_PATH=$db
AGE_RECIPIENT=$(age-keygen -y "$home/age-key.txt")
REMOTE=r2:$bucket/rehearsal
RCLONE_CONFIG=$home/rclone.conf
LOCAL_DIR=$work/local
HEALTHCHECK_URL=
EOF
    # A new folder in R2 for each run, so one run can't be confused with another's history
    cat >"$work/litestream.yml" <<EOF
dbs:
  - path: $db
    busy-timeout: 5s
    replica:
      type: s3
      bucket: $bucket
      path: rehearsal/litestream-$stamp
      endpoint: $endpoint
      region: auto
      access-key-id: "$access"
      secret-access-key: "$secret"
      sync-interval: 10s
EOF
    export SLIOT_BACKUP_CONF="$work/backup.env"
    export LITESTREAM_CONFIG="$work/litestream.yml"
    export AGE_IDENTITY="$home/age-key.txt"
    stream_pid=""
    finish() {
      if [ -n "$stream_pid" ]; then kill "$stream_pid" 2>/dev/null || true; fi
      # The generated file holds the keys
      rm -f -- "$work/litestream.yml"
    }
    trap finish EXIT

    log "--- snapshot: upload and restore"
    bash "$here/sliot-snapshot.sh" nightly
    bash "$here/sliot-restore.sh" snapshot latest "$work/from-snapshot.db"

    log "--- continuous copy: about 40 seconds"
    litestream replicate -config "$work/litestream.yml" >"$work/litestream.log" 2>&1 &
    stream_pid=$!
    sleep 15
    kill -0 "$stream_pid" 2>/dev/null || { tail -n 20 "$work/litestream.log"; die "Litestream stopped"; }
    # A write made while it runs, which the restore must include
    sqlite3 -cmd ".timeout 5000" "$db" "CREATE TABLE rehearsal_marker (note TEXT); INSERT INTO rehearsal_marker VALUES ('$stamp');"
    sleep 25
    bash "$here/sliot-restore.sh" litestream "$work/from-litestream.db" ||
      { tail -n 20 "$work/litestream.log"; die "restore from the continuous copy failed"; }

    from_snapshot="$(sqlite3 "$work/from-snapshot.db" 'SELECT count(*) FROM teams;')"
    from_stream="$(sqlite3 "$work/from-litestream.db" 'SELECT count(*) FROM teams;')"
    marker="$(sqlite3 "$work/from-litestream.db" 'SELECT note FROM rehearsal_marker;')"
    log "teams: original $expected, snapshot $from_snapshot, continuous copy $from_stream"
    [ "$from_snapshot" = "$expected" ] || die "the snapshot restore doesn't match"
    [ "$from_stream" = "$expected" ] || die "the continuous restore doesn't match"
    [ "$marker" = "$stamp" ] || die "the continuous restore is missing the latest write"
    log "PASSED. Test files are in r2:$bucket/rehearsal/ and $work"
    ;;
  *)
    die "usage: rehearse.sh setup | run TEST.db"
    ;;
esac
