# Database backups

Two independent backups of `/var/lib/sliot/sliot.db` go to the R2 bucket `sliot-backups` (`docs/architecture.md`, section 9). Both run as **root**, so a broken-into website can't read the R2 keys.

| Backup | Tool | When | Where in the bucket | Kept |
|---|---|---|---|---|
| Continuous copy | Litestream (service `litestream`) | About every 10 seconds while data changes | `litestream/` | 7 days, any moment |
| Nightly snapshot | `sliot-snapshot` (systemd timer) | 02:30 Sri Lanka time | `snapshots/nightly/` | 90 days |
| Pre-migration snapshot | `sliot-snapshot` (first step of every deploy) | Before each deploy | `snapshots/pre-migrate/`, plus the last 10 in `/var/backups/sliot/pre-migrate/` | 90 days |

Snapshots are encrypted with an `age` key pair. The server holds only the public key; the private key is in the organizers' password manager.

| File here | Goes to |
|---|---|
| `sliot-snapshot.sh` | `/usr/local/sbin/sliot-snapshot` |
| `sliot-restore.sh` | `/usr/local/sbin/sliot-restore` |
| `backup.env.example` | `/etc/sliot-backup/backup.env` |
| `rclone.conf.example` | `/etc/sliot-backup/rclone.conf` |
| `litestream.yml.example` | `/etc/litestream.yml` |
| `sliot-snapshot.service`, `sliot-snapshot.timer` | `/etc/systemd/system/` |
| `sliot-deploy.sudoers` | `/etc/sudoers.d/sliot-deploy` |
| `test-local.sh`, `rehearse.sh` | Not installed: for testing |

## Test on a laptop (WSL or Linux)

Tools (Ubuntu 24.04):

```bash
sudo apt install sqlite3 age rclone curl python3
# Litestream isn't in Ubuntu's packages
curl -LO https://github.com/benbjohnson/litestream/releases/download/v0.5.18/litestream-0.5.18-linux-x86_64.deb
echo "11d36a2d2058731ee99f201f6b68a52fcb1dd3050bdfd2237f7f39741dafe6ae  litestream-0.5.18-linux-x86_64.deb" | sha256sum -c
sudo apt install ./litestream-0.5.18-linux-x86_64.deb
```

With a folder standing in for R2 (no keys, no network):

```bash
bash deploy/backup/test-local.sh
sudo bash deploy/backup/test-local.sh   # also checks that root doesn't take over the app's files
```

## Rehearsal against R2

Writes only under `rehearsal/` in the bucket and never pings healthchecks.io. Use freshly seeded test data, never a database with real details. In PowerShell on Windows, from the project folder:

```powershell
$env:DATABASE_PATH="data/rehearsal.db"; pnpm db:seed; Remove-Item Env:DATABASE_PATH
```

Then in WSL, from the project folder:

```bash
bash deploy/backup/rehearse.sh setup      # makes ~/sliot-rehearsal and the age key pair
nano ~/sliot-rehearsal/rclone.conf        # R2 token and account ID
bash deploy/backup/rehearse.sh run data/rehearsal.db
```

`setup` prints the age public key; the same pair is used on the server. Save `~/sliot-rehearsal/age-key.txt` in the password manager. After a pass, delete the `rehearsal/` folder in the R2 dashboard, delete `~/sliot-rehearsal` and `data/rehearsal.db`.

## Server setup (before merging into `main`)

**Status:** steps 1–6 were done on the production server (Ubuntu 22.04, Node 22) on 2026-11-26, and step 9 in Cloudflare. Steps 7 and 8 follow the first deploy.

The deploy stops if there is a database but no backup tool, so do this first.

**1. Check the assumptions.** Ubuntu or Debian with systemd; the app and the GitHub runner run as the same user (`hpc-16` below), and that user can't run any command through sudo without a password. On the production server `hpc-16` is in the `docker` group (other projects there need it), which is root-equivalent; this is accepted because of the bucket lock in step 9, which is therefore required (decided 2026-11-26):

```bash
cat /etc/os-release
ps -o user= -C Runner.Listener
sudo -k; sudo -n true    # as the app user: "a password is required" is the good answer
```

**2. Install the tools** (`sqlite3 age rclone curl python3` and Litestream, as above). `rclone version` must be 1.60 or later. Ubuntu 22.04's package is older, so install the others with apt and rclone from rclone.org. The server is shared: `NEEDRESTART_MODE=l` stops apt restarting other services.

```bash
sudo apt-get update
sudo env NEEDRESTART_MODE=l apt-get install sqlite3 age curl python3
mkdir -p ~/sliot-downloads && cd ~/sliot-downloads
V=$(curl -fsS https://downloads.rclone.org/version.txt | awk '{print $2}')
curl -fLO "https://downloads.rclone.org/$V/rclone-$V-linux-amd64.deb"
curl -fsS "https://downloads.rclone.org/$V/SHA256SUMS" | grep " rclone-$V-linux-amd64.deb\$" | sha256sum -c
# download and check the Litestream package as above, then:
sudo dpkg -i rclone-*.deb litestream-0.5.18-linux-x86_64.deb
```

Leave the `litestream` service disabled until step 7.

**3. Get these files** from a temporary clone of `full-site`; the live deploy folder stays untouched:

```bash
git clone --depth 1 --branch full-site <repository URL> /tmp/sliot-setup
cd /tmp/sliot-setup
bash deploy/backup/test-local.sh        # 46 passed on the server
sudo bash deploy/backup/test-local.sh   # 51 passed on the server
cd deploy/backup
```

The remaining commands run from this `deploy/backup` folder.

**4. Folders and scripts:**

```bash
sudo install -d -m 700 -o hpc-16 -g hpc-16 /var/lib/sliot
sudo install -d -m 700 /etc/sliot-backup /var/backups/sliot
sudo install -m 755 sliot-snapshot.sh /usr/local/sbin/sliot-snapshot
sudo install -m 755 sliot-restore.sh /usr/local/sbin/sliot-restore
```

**5. Settings** (fill each in with `sudoedit`; keys and the ping address come from the password manager):

```bash
sudo install -m 600 backup.env.example /etc/sliot-backup/backup.env
sudo install -m 600 rclone.conf.example /etc/sliot-backup/rclone.conf
sudo install -m 600 litestream.yml.example /etc/litestream.yml
sudoedit /etc/sliot-backup/backup.env
sudoedit /etc/sliot-backup/rclone.conf
sudoedit /etc/litestream.yml
```

`DATABASE_PATH` here, the `path` in `litestream.yml` and `DATABASE_PATH` in `/etc/sliot/sliot.env` must be the same. `REMOTE` is `r2:sliot-backups` and the Litestream `path` is `litestream` (no `rehearsal`). The server gets only the `age` public key.

Check that nothing is left empty (three file names with nothing under them, then `1`), and that the server can write to, read from and delete in the bucket:

```bash
for f in /etc/sliot-backup/backup.env /etc/sliot-backup/rclone.conf /etc/litestream.yml; do echo "== $f"; sudo grep -vE '^\s*#' $f | grep -E 'ACCOUNT_ID|= *$|""'; done
sudo grep -c '^AGE_RECIPIENT=age1' /etc/sliot-backup/backup.env
R="sudo rclone --config /etc/sliot-backup/rclone.conf"
echo ok | $R rcat r2:sliot-backups/setup-test.txt && $R cat r2:sliot-backups/setup-test.txt && $R deletefile r2:sliot-backups/setup-test.txt && echo "R2 works"
```

**6. Timer and sudo rule:**

```bash
sudo install -m 644 sliot-snapshot.service sliot-snapshot.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo visudo -cf sliot-deploy.sudoers                # after checking the user name in it
sudo install -m 440 sliot-deploy.sudoers /etc/sudoers.d/sliot-deploy
```

As the app user, run `sudo -k` and then `sudo -n /usr/local/sbin/sliot-snapshot pre-migrate`: it should answer "no database ... yet" without asking for a password.

**7. After the first deploy** has created the database (the timer waits until now, since a nightly run without a database fails and alerts the organizers):

```bash
sudo systemctl enable --now sliot-snapshot.timer
systemctl list-timers sliot-snapshot.timer          # next run at 02:30 Sri Lanka time
sudo systemctl enable --now litestream
systemctl cat litestream | grep -i '^User' || echo "runs as root"
sudo journalctl -u litestream -n 30
sudo systemctl start sliot-snapshot.service
sudo journalctl -u sliot-snapshot -n 30
ls -la /var/lib/sliot                               # sliot.db, -wal and -shm owned by the app user
```

Then check that healthchecks.io shows the check as up, that the admin login on the site works (it writes to the database), and that `curl -s http://127.0.0.1:3000/api/health` says `ok`. Delete `/tmp/sliot-setup`.

**8. Restore drill before registration opens** (below). Compare the counts with the admin dashboard.

**9. In Cloudflare R2** (can be done at any time): on `sliot-backups`, a lifecycle rule that deletes objects under `snapshots/` after 90 days, and a 30-day bucket lock on `snapshots/` (required). No lock on `litestream/`: Litestream removes its own old files.

## Restore drill (monthly during the competition)

On a laptop with the tools, using a second R2 token that can only **read** the bucket. In a folder outside the project, such as `~/sliot-drill` (mode 700), put:

- `rclone.conf` and `backup.env` (from the examples; `RCLONE_CONFIG` points at that `rclone.conf`)
- `litestream.yml` with the read-only keys
- `age-key.txt` from the password manager

```bash
export SLIOT_BACKUP_CONF=~/sliot-drill/backup.env LITESTREAM_CONFIG=~/sliot-drill/litestream.yml
export AGE_IDENTITY=~/sliot-drill/age-key.txt
bash deploy/backup/sliot-restore.sh snapshot latest ~/sliot-drill/snapshot.db
bash deploy/backup/sliot-restore.sh litestream ~/sliot-drill/continuous.db
```

Compare the counts with the live dashboard. **The restored files hold real personal data:** delete them and `age-key.txt` afterwards (`rm -rf ~/sliot-drill`).

## Restoring for real

**1. Get a checked copy.** Pick one:

```bash
sudo sliot-restore litestream /var/backups/sliot/restored.db                            # newest
sudo sliot-restore litestream /var/backups/sliot/restored.db 2027-03-01T10:30:00+05:30  # a moment
sudo sliot-restore snapshot /var/backups/sliot/pre-migrate/<file>.db.gz /var/backups/sliot/restored.db   # undo a migration
```

A snapshot from R2 also needs the private key on the server for a moment:

```bash
sudo AGE_IDENTITY=/root/age-key.txt sliot-restore snapshot latest /var/backups/sliot/restored.db
sudo shred -u /root/age-key.txt
```

**2. Put it into place:**

```bash
pm2 stop sliot-web                                  # as the app user
sudo systemctl stop litestream sliot-snapshot.timer
sudo mkdir -m 700 /var/backups/sliot/replaced
sudo find /var/lib/sliot -maxdepth 1 \( -name 'sliot.db*' -o -name '.sliot.db-litestream' \) -exec mv -t /var/backups/sliot/replaced {} +
sudo install -m 600 -o hpc-16 -g hpc-16 /var/backups/sliot/restored.db /var/lib/sliot/sliot.db
sudo systemctl start litestream sliot-snapshot.timer
pm2 start sliot-web                                 # as the app user
```

**3. Check:** the site loads, an admin can log in, the team count is right, `/api/health` says `ok`, and `journalctl -u litestream` shows no errors. If Litestream complains about the history, run `sudo litestream reset /var/lib/sliot/sliot.db` and restart it.

When undoing a bad migration, also revert the commit that added it before the next deploy, or the deploy applies it again.

**Whole server lost:** rebuild it (`docs/architecture.md`, section 9), do the server setup above up to step 5, then restore before starting the app.
