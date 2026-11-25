#!/usr/bin/env bash
# Brings a backup back as a new file, checks it and prints what is in it. It never overwrites a
# file and never touches the live database; putting a restored copy into place is a manual step
# (deploy/backup/README.md). Installed as /usr/local/sbin/sliot-restore.
#
#   sliot-restore list                          show the snapshots in R2
#   sliot-restore snapshot latest OUT.db        the newest snapshot in R2
#   sliot-restore snapshot KEY OUT.db           one from the list, e.g. snapshots/nightly/....age
#   sliot-restore snapshot FILE OUT.db          a local .db.gz (pre-migration) or .db.gz.age file
#   sliot-restore litestream OUT.db [TIME]      the continuous copy, now or at a time such as
#                                               2027-03-01T10:30:00+05:30
#
# Encrypted snapshots need the age private key: set AGE_IDENTITY to the path of a file holding
# it, and delete that file afterwards. Settings: /etc/sliot-backup/backup.env, or
# SLIOT_BACKUP_CONF; Litestream: /etc/litestream.yml, or LITESTREAM_CONFIG.

set -Eeuo pipefail
umask 077

CONF="${SLIOT_BACKUP_CONF:-/etc/sliot-backup/backup.env}"
LITESTREAM_CONFIG="${LITESTREAM_CONFIG:-/etc/litestream.yml}"
identity="${AGE_IDENTITY:-}"

log() { echo "sliot-restore: $*"; }
die() { echo "sliot-restore: ERROR: $*" >&2; exit 1; }
usage() { die "usage: sliot-restore list | snapshot latest|KEY|FILE OUT.db | litestream OUT.db [TIME]"; }

DATABASE_PATH=""
REMOTE=""
RCLONE_CONFIG=""
AGE_IDENTITY=""
# A local file can be restored on a machine without a settings file
if [ -r "$CONF" ]; then
  # shellcheck source=/dev/null
  . "$CONF"
fi
identity="${identity:-$AGE_IDENTITY}"
if [ -n "$RCLONE_CONFIG" ]; then export RCLONE_CONFIG; else unset RCLONE_CONFIG; fi

need_remote() { [ -n "$REMOTE" ] || die "REMOTE is not set; check $CONF"; }

# Newest last. Names start with the time they were taken, so sort by name, not by folder
list_snapshots() {
  rclone lsf --recursive --files-only "$REMOTE/snapshots" |
    { grep -E '\.db\.gz\.age$' || true; } |
    awk -F/ '{ print $NF "\t" "snapshots/" $0 }' |
    sort |
    cut -f2
}

command="${1:-}"
case "$command" in
  list)
    need_remote
    list_snapshots
    exit 0
    ;;
  snapshot)
    [ "$#" -eq 3 ] || usage
    source="$2"
    out="$3"
    ;;
  litestream)
    [ "$#" -eq 2 ] || [ "$#" -eq 3 ] || usage
    out="$2"
    at="${3:-}"
    ;;
  *) usage ;;
esac

[ ! -e "$out" ] || die "$out already exists; choose a new file name"
[ -d "$(dirname "$out")" ] || die "the folder $(dirname "$out") doesn't exist"

work="$(mktemp -d "$(dirname "$out")/restore.XXXXXX")"
trap 'rm -rf -- "$work"' EXIT
restored="$work/restored.db"

if [ "$command" = snapshot ]; then
  if [ -f "$source" ]; then
    file="$source"
  else
    need_remote
    if [ "$source" = latest ]; then
      source="$(list_snapshots | tail -n 1)" || die "couldn't list the snapshots"
      [ -n "$source" ] || die "there are no snapshots in $REMOTE"
    fi
    log "downloading $source"
    file="$work/$(basename "$source")"
    rclone copyto "$REMOTE/$source" "$file" || die "couldn't download $source"
    [ -f "$file" ] || die "$source wasn't found in $REMOTE"
  fi
  case "$file" in
    *.db.gz.age)
      [ -r "$identity" ] || die "set AGE_IDENTITY to the file holding the age private key"
      age --decrypt --identity "$identity" "$file" | gunzip -c > "$restored" || die "couldn't decrypt or unpack"
      ;;
    *.db.gz) gunzip -c "$file" > "$restored" || die "couldn't unpack" ;;
    *) die "expected a .db.gz or .db.gz.age file" ;;
  esac
else
  [ -n "$DATABASE_PATH" ] || die "DATABASE_PATH is not set; check $CONF"
  args=(restore -config "$LITESTREAM_CONFIG" -o "$restored")
  if [ -n "$at" ]; then args+=(-timestamp "$at"); fi
  litestream "${args[@]}" "$DATABASE_PATH" || die "Litestream couldn't restore"
fi

[ -s "$restored" ] || die "nothing was restored"
check="$(sqlite3 "$restored" 'PRAGMA integrity_check;')" || die "couldn't check the restored file"
[ "$check" = "ok" ] || die "the restored file failed its integrity check: $check"

summary="$(sqlite3 "$restored" "
  SELECT 'teams:       ' || count(*) FROM teams;
  SELECT 'members:     ' || count(*) FROM members;
  SELECT 'submissions: ' || count(*) FROM submissions;
  SELECT 'newest team: ' || coalesce(datetime(max(created_at) / 1000, 'unixepoch', '+330 minutes') || ' (Sri Lanka)', 'none') FROM teams;
")" || die "the restored file doesn't look like the SLIoT database"

mv "$restored" "$out"
# Opening the copy may leave WAL files beside the temporary name; they go with the work folder
log "restored to $out (integrity check passed)"
echo "$summary"
