#!/usr/bin/env bash
# One checked, compressed, encrypted copy of the database, uploaded to R2
# (docs/architecture.md section 9). Installed as /usr/local/sbin/sliot-snapshot, run as root.
#
#   sliot-snapshot nightly       from the systemd timer. Any failure is a failure, and the
#                                healthchecks.io check is told about success and failure.
#   sliot-snapshot pre-migrate   from the deploy, before anything changes. A copy that can't be
#                                made or fails its check stops the deploy. The copy is also kept
#                                on this server, so a failed upload only warns.
#
# Settings come from /etc/sliot-backup/backup.env (see backup.env.example). SLIOT_BACKUP_CONF
# points elsewhere for tests; sudo removes it, so the deploy can't change the settings.

set -Eeuo pipefail
umask 077

CONF="${SLIOT_BACKUP_CONF:-/etc/sliot-backup/backup.env}"
MODE="${1:-}"

log() { echo "sliot-snapshot: $*"; }
die() { echo "sliot-snapshot: ERROR: $*" >&2; exit 1; }

case "$MODE" in
  nightly | pre-migrate) ;;
  *) die "usage: sliot-snapshot nightly|pre-migrate" ;;
esac
[ "$#" -eq 1 ] || die "usage: sliot-snapshot nightly|pre-migrate"
[ -r "$CONF" ] || die "can't read settings file $CONF"

DATABASE_PATH=""
AGE_RECIPIENT=""
REMOTE=""
RCLONE_CONFIG=""
LOCAL_DIR=""
KEEP_LOCAL=10
HEALTHCHECK_URL=""
# shellcheck source=/dev/null
. "$CONF"

# Only the nightly run reports to healthchecks.io, so a deploy can't hide a broken nightly job.
# The address goes through stdin to keep it out of the process list and the logs.
ping_check() {
  [ "$MODE" = nightly ] && [ -n "$HEALTHCHECK_URL" ] || return 0
  printf 'url = "%s%s"\n' "$HEALTHCHECK_URL" "${1:-}" |
    curl --silent --fail --max-time 10 --retry 3 --output /dev/null --config - ||
    log "WARNING: couldn't reach healthchecks.io"
}

work=""
finish() {
  status=$?
  if [ -n "$work" ]; then rm -rf -- "$work"; fi
  if [ "$status" -ne 0 ]; then ping_check /fail; fi
}
trap finish EXIT

[ -n "$DATABASE_PATH" ] || die "DATABASE_PATH is not set in $CONF"
[ -n "$LOCAL_DIR" ] || die "LOCAL_DIR is not set in $CONF"
[[ "$KEEP_LOCAL" =~ ^[1-9][0-9]*$ ]] || die "KEEP_LOCAL must be a number, 1 or more"

if [ ! -f "$DATABASE_PATH" ]; then
  # A missing folder means the path is wrong; a missing file in it means nothing is stored yet
  [ -d "$(dirname "$DATABASE_PATH")" ] || die "the database folder doesn't exist: $(dirname "$DATABASE_PATH")"
  if [ "$MODE" = pre-migrate ]; then
    log "no database at $DATABASE_PATH yet, nothing to copy"
    exit 0
  fi
  die "no database at $DATABASE_PATH"
fi

mkdir -p "$LOCAL_DIR"
work="$(mktemp -d "$LOCAL_DIR/work.XXXXXX")"
stamp="$(TZ=Asia/Colombo date +%Y-%m-%dT%H%M%S)"
copy="$work/$stamp.db"

# SQLite's own backup gives a consistent copy while the app keeps writing
sqlite3 "$DATABASE_PATH" ".timeout 10000" ".backup '$copy'" || die "couldn't copy the database"
[ -s "$copy" ] || die "the copy is empty"
check="$(sqlite3 "$copy" 'PRAGMA integrity_check;')" || die "couldn't check the copy"
[ "$check" = "ok" ] || die "the copy failed its integrity check: $check"
# An empty database also passes the check, so make sure our tables are in it
teams="$(sqlite3 "$copy" 'SELECT count(*) FROM teams;')" || die "the copy has no teams table"
log "copy checked: $teams teams"

if [ "$MODE" = pre-migrate ]; then
  keep="$LOCAL_DIR/pre-migrate"
  mkdir -p "$keep"
  gzip -9 -c "$copy" > "$work/local.db.gz" || die "couldn't compress the copy"
  mv "$work/local.db.gz" "$keep/$stamp.db.gz"
  log "kept on this server: $keep/$stamp.db.gz"
  mapfile -t old < <(find "$keep" -maxdepth 1 -name '*.db.gz' | sort | head -n "-$KEEP_LOCAL")
  if [ "${#old[@]}" -gt 0 ]; then rm -f -- "${old[@]}"; fi
fi

key="snapshots/$MODE/$stamp.db.gz.age"

# Chained with && because "set -e" is off inside a function that is tested by "if"
upload() {
  [ -n "$AGE_RECIPIENT" ] || { log "AGE_RECIPIENT is not set in $CONF"; return 1; }
  [ -n "$REMOTE" ] || { log "REMOTE is not set in $CONF"; return 1; }
  if [ -n "$RCLONE_CONFIG" ]; then export RCLONE_CONFIG; else unset RCLONE_CONFIG; fi
  gzip -9 -c "$copy" | age --encrypt --recipient "$AGE_RECIPIENT" --output "$work/upload.age" &&
    timeout 300 rclone copyto "$work/upload.age" "$REMOTE/$key" \
      --retries 3 --low-level-retries 3 --contimeout 15s --timeout 60s
}

if upload; then
  log "uploaded: $key"
elif [ "$MODE" = pre-migrate ]; then
  # "::warning" makes GitHub Actions show this on the deploy's summary page
  echo "::warning title=Backup upload failed::The pre-migration snapshot is only on the server. The deploy continues."
  exit 0
else
  die "the snapshot wasn't uploaded"
fi

ping_check
log "done"
