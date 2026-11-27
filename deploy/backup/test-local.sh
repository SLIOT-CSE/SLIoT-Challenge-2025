#!/usr/bin/env bash
# Tests sliot-snapshot and sliot-restore on Linux (or WSL) with a folder standing in for R2.
# Needs sqlite3, age, rclone, curl, python3 and, for the continuous-copy tests, litestream.
# Uses only a temporary folder: no keys, no network, nothing outside /tmp.
#
#   bash deploy/backup/test-local.sh          # as any user
#   sudo bash deploy/backup/test-local.sh     # also checks root can't take the app's files over

set -Euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
snapshot="$here/sliot-snapshot.sh"
restore="$here/sliot-restore.sh"
for tool in sqlite3 age age-keygen rclone curl python3; do
  command -v "$tool" >/dev/null || { echo "missing tool: $tool" >&2; exit 2; }
done

t="$(mktemp -d /tmp/sliot-backup-test.XXXXXX)"
pids=()
cleanup() {
  for pid in "${pids[@]}"; do kill "$pid" 2>/dev/null; done
  # Litestream syncs once more as it stops, so wait before removing its files
  wait 2>/dev/null
  rm -rf -- "$t"
}
trap cleanup EXIT
chmod 755 "$t"

passed=0
failed=0
skipped=0
ok() { passed=$((passed + 1)); echo "  ok    $1"; }
bad() { failed=$((failed + 1)); echo "  FAIL  $1"; if [ -f "$t/out" ]; then sed 's/^/        | /' "$t/out"; fi; }
skip() { skipped=$((skipped + 1)); echo "  skip  $1"; }
# check "name" command...: passes when the command succeeds
check() { local name="$1"; shift; if "$@"; then ok "$name"; else bad "$name"; fi; }
succeeds() { "$@" >"$t/out" 2>&1; }
fails() { ! "$@" >"$t/out" 2>&1; }
said() { grep -qF -- "$1" "$t/out"; }
count() { find "$1" -type f -name "$2" 2>/dev/null | wc -l; }

# A stand-in for healthchecks.io that records which addresses were called
cat >"$t/pings.py" <<'PY'
import http.server, sys

class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        with open(sys.argv[1], "a") as log:
            log.write(self.path + "\n")
        self.send_response(200)
        self.end_headers()

    def log_message(self, *args):
        pass

server = http.server.HTTPServer(("127.0.0.1", 0), Handler)
print(server.server_port, flush=True)
server.serve_forever()
PY
: >"$t/pings"
python3 "$t/pings.py" "$t/pings" >"$t/port" &
pids+=($!)
for _ in $(seq 50); do [ -s "$t/port" ] && break; sleep 0.1; done
port="$(cat "$t/port")"
pinged() { grep -qx -- "$1" "$t/pings"; }

# The tables sliot-restore reports on, in WAL mode like the app
make_db() {
  sqlite3 "$1" "
    PRAGMA journal_mode = WAL;
    CREATE TABLE teams (id INTEGER PRIMARY KEY, created_at INTEGER NOT NULL);
    CREATE TABLE members (id INTEGER PRIMARY KEY);
    CREATE TABLE submissions (id INTEGER PRIMARY KEY);
    INSERT INTO teams (created_at) VALUES (1800000000000), (1800000001000), (1800000002000);
    INSERT INTO members DEFAULT VALUES;" >/dev/null
}

age-keygen -o "$t/key.txt" >/dev/null 2>&1
age-keygen -o "$t/other-key.txt" >/dev/null 2>&1
recipient="$(age-keygen -y "$t/key.txt")"
: >"$t/rclone.conf"
mkdir -p "$t/data" "$t/remote" "$t/restored"

write_conf() { # write_conf FILE DATABASE REMOTE
  cat >"$1" <<EOF
DATABASE_PATH=$2
AGE_RECIPIENT=$recipient
REMOTE=$3
RCLONE_CONFIG=$t/rclone.conf
LOCAL_DIR=$t/local
KEEP_LOCAL=2
HEALTHCHECK_URL=http://127.0.0.1:$port/ping
EOF
}
write_conf "$t/good.env" "$t/data/sliot.db" "$t/remote"
write_conf "$t/offline.env" "$t/data/sliot.db" "no-such-remote:bucket"
write_conf "$t/nofolder.env" "$t/nowhere/sliot.db" "$t/remote"
write_conf "$t/corrupt.env" "$t/data/corrupt.db" "$t/remote"
run() { local conf="$1"; shift; SLIOT_BACKUP_CONF="$t/$conf.env" bash "$@"; }

echo "Before there is a database"
check "pre-migrate skips it" succeeds run good "$snapshot" pre-migrate
check "  and says so" said "nothing to copy"
check "nightly fails" fails run good "$snapshot" nightly
check "  and reports the failure" pinged /ping/fail
check "a wrong folder stops a deploy" fails run nofolder "$snapshot" pre-migrate
check "an unknown mode is refused" fails run good "$snapshot" weekly

make_db "$t/data/sliot.db"

echo "Nightly snapshot"
: >"$t/pings"
check "succeeds" succeeds run good "$snapshot" nightly
check "uploads one encrypted file" test "$(count "$t/remote/snapshots/nightly" '*.db.gz.age')" = 1
check "reports success" pinged /ping
check "  and no failure" fails pinged /ping/fail
check "leaves no work files" test "$(find "$t/local" -name 'work.*' | wc -l)" = 0
first="$(find "$t/remote/snapshots/nightly" -type f | head -n 1)"
check "the file is encrypted" fails grep -qa "SQLite format" "$first"

echo "Restoring"
check "the latest snapshot" succeeds env AGE_IDENTITY="$t/key.txt" SLIOT_BACKUP_CONF="$t/good.env" bash "$restore" snapshot latest "$t/restored/latest.db"
check "  with every team" said "teams:       3"
check "never overwrites a file" fails env AGE_IDENTITY="$t/key.txt" SLIOT_BACKUP_CONF="$t/good.env" bash "$restore" snapshot latest "$t/restored/latest.db"
check "needs the right key" fails env AGE_IDENTITY="$t/other-key.txt" SLIOT_BACKUP_CONF="$t/good.env" bash "$restore" snapshot latest "$t/restored/wrong.db"
check "  and says what failed" said "couldn't decrypt or unpack"
check "  and writes nothing without it" test ! -e "$t/restored/wrong.db"
check "needs a key at all" fails run good "$restore" snapshot latest "$t/restored/nokey.db"
check "lists the snapshots" succeeds run good "$restore" list
check "  by name" said "snapshots/nightly/"
check "an unknown snapshot fails" fails env AGE_IDENTITY="$t/key.txt" SLIOT_BACKUP_CONF="$t/good.env" bash "$restore" snapshot snapshots/nightly/none.db.gz.age "$t/restored/none.db"

echo "Pre-migration snapshot"
: >"$t/pings"
sleep 1
check "succeeds" succeeds run good "$snapshot" pre-migrate
check "keeps a copy on the server" test "$(count "$t/local/pre-migrate" '*.db.gz')" = 1
check "uploads it" test "$(count "$t/remote/snapshots/pre-migrate" '*.db.gz.age')" = 1
check "doesn't ping healthchecks" test ! -s "$t/pings"
kept="$(find "$t/local/pre-migrate" -type f | head -n 1)"
check "the kept copy restores without a key or settings" succeeds env SLIOT_BACKUP_CONF="$t/none.env" bash "$restore" snapshot "$kept" "$t/restored/kept.db"
check "  with every team" said "teams:       3"
sleep 1
succeeds run good "$snapshot" pre-migrate
sleep 1
succeeds run good "$snapshot" pre-migrate
check "keeps only the newest KEEP_LOCAL copies" test "$(count "$t/local/pre-migrate" '*.db.gz')" = 2
check "  dropping the oldest" test ! -e "$kept"
sqlite3 "$t/data/sliot.db" "INSERT INTO teams (created_at) VALUES (1800000003000);"
sleep 1
succeeds run good "$snapshot" pre-migrate
check "latest means newest, whichever folder it's in" succeeds env AGE_IDENTITY="$t/key.txt" SLIOT_BACKUP_CONF="$t/good.env" bash "$restore" snapshot latest "$t/restored/newest.db"
check "  with the new team" said "teams:       4"

echo "When the upload fails"
: >"$t/pings"
rm -rf "$t/local/pre-migrate"
check "pre-migrate lets the deploy continue" succeeds run offline "$snapshot" pre-migrate
check "  with a warning" said "::warning title=Backup upload failed::"
check "  and the copy kept on the server" test "$(count "$t/local/pre-migrate" '*.db.gz')" = 1
check "nightly fails" fails run offline "$snapshot" nightly
check "  and reports the failure" pinged /ping/fail
check "  without reporting success" fails pinged /ping

echo "A damaged database"
make_db "$t/data/corrupt.db"
sqlite3 "$t/data/corrupt.db" "PRAGMA wal_checkpoint(TRUNCATE);" >/dev/null
# Overwrite the second page (the teams table) with noise
dd if=/dev/urandom of="$t/data/corrupt.db" bs=4096 seek=1 count=1 conv=notrunc status=none
rm -rf "$t/local/pre-migrate"
check "stops the deploy" fails run corrupt "$snapshot" pre-migrate
check "  because of the damage" grep -qE "couldn't copy the database|failed its integrity check|couldn't check the copy" "$t/out"
check "  and keeps no copy of it" test "$(count "$t/local/pre-migrate" '*.db.gz')" = 0

as_app() { runuser -u nobody -- "$@"; }
if [ "$(id -u)" = 0 ]; then
  mkdir -p "$t/app" && chown nobody: "$t/app"
  as_app bash -c "$(declare -f make_db); make_db '$t/app/sliot.db'"
  write_conf "$t/app.env" "$t/app/sliot.db" "$t/remote"
fi

echo "Root and the app's files"
if [ "$(id -u)" = 0 ]; then
  check "root takes a snapshot of the app's database" succeeds run app "$snapshot" nightly
  check "  and the app can still write" succeeds as_app sqlite3 "$t/app/sliot.db" "INSERT INTO members DEFAULT VALUES;"
  check "  and root owns nothing beside it" test -z "$(find "$t/app" -maxdepth 1 -type f -user root)"
else
  skip "needs sudo"
fi

echo "Continuous copy (Litestream)"
if ! command -v litestream >/dev/null; then
  skip "litestream isn't installed"
else
  if [ "$(id -u)" = 0 ]; then
    db="$t/app/sliot.db"
    writer=(runuser -u nobody --)
  else
    db="$t/data/sliot.db"
    writer=()
  fi
  insert() { "${writer[@]}" sqlite3 -cmd ".timeout 5000" "$db" "INSERT INTO teams (created_at) VALUES (1800000009000);"; }
  teams_in() { sqlite3 "$1" "SELECT count(*) FROM teams;"; }
  cat >"$t/litestream.yml" <<EOF
dbs:
  - path: $db
    busy-timeout: 5s
    replica:
      type: file
      path: $t/replica
      sync-interval: 1s
EOF
  write_conf "$t/stream.env" "$db" "$t/remote"
  stream() { env LITESTREAM_CONFIG="$t/litestream.yml" SLIOT_BACKUP_CONF="$t/stream.env" bash "$restore" litestream "$@"; }

  # An app connection that stays open, as the running site's does
  mkfifo "$t/app-sql"
  "${writer[@]}" sqlite3 "$db" <"$t/app-sql" >/dev/null &
  app_connection=$!
  exec 9>"$t/app-sql"
  echo "SELECT count(*) FROM teams;" >&9

  # 9>&- so Litestream doesn't hold the app connection's input open
  litestream replicate -config "$t/litestream.yml" >"$t/litestream.log" 2>&1 9>&- &
  pids+=($!)
  sleep 4
  before="$(teams_in "$db")"
  sleep 1
  moment="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  sleep 2
  check "the app writes while it runs" succeeds insert
  sleep 4
  check "restores" succeeds stream "$t/restored/stream.db"
  check "  including the newest write" test "$(teams_in "$t/restored/stream.db")" = "$((before + 1))"
  check "restores to an earlier moment" succeeds stream "$t/restored/earlier.db" "$moment"
  check "  without the later write" test "$(teams_in "$t/restored/earlier.db")" = "$before"
  if [ "$(id -u)" = 0 ]; then
    check "the app can still write with Litestream running" succeeds insert
    check "root owns neither the database nor its WAL files" test -z "$(find "$t/app" -maxdepth 1 -type f -name 'sliot.db*' -user root)"
  fi
  # Closing its input ends the app connection
  exec 9>&-
  wait "$app_connection"
  if [ "$failed" -gt 0 ]; then sed 's/^/  litestream | /' "$t/litestream.log" | tail -n 30; fi
fi

echo
echo "$passed passed, $failed failed, $skipped skipped"
[ "$failed" -eq 0 ]
