# SLIoT Challenge 2027: Operations guide

For the organizers running the live site. Written 2026-11-27, the day registration opened. How the site works is in [architecture.md](architecture.md); backups and restores are in [../deploy/backup/README.md](../deploy/backup/README.md).

- Site: https://sliot.cse.mrt.ac.lk
- Dashboard: https://sliot.cse.mrt.ac.lk/admin
- All times are Sri Lanka time.

## 1. Rules for the live site

- **Don't test on it.** Finalising the shortlist and changing deadlines act on every team.
- **Don't run `pnpm db:seed` on the server.** It is for test data only.
- **Run server commands as `hpc-16`, without `sudo`**, unless a command here starts with `sudo`. Root could end up owning the database, and the site couldn't write to it.
- **Every push to `main` deploys.** Do it at a quiet time, never close to a deadline.
- The server is shared with other projects. Don't change their containers, nginx entries or folders.

## 2. Still to do

| Task | By | Why |
|---|---|---|
| Set up uptime monitoring (section 6) | Now | To learn when the site is down |
| Restore drill from R2 ([steps](../deploy/backup/README.md)) | Now | Proves the backups can be restored |
| Delete remaining test teams (section 5) | Now | Keeps real data clean |
| Check healthchecks.io after the first 02:30 backup | 28 November | First scheduled run |
| Save `sliot.env` and the Google key in the password manager; enable Dependabot alerts | Now | Needed to rebuild the server |
| Close the old Google registration form, pointing to the home page | Now | Some browsers still remember the old `/register` redirect |
| Replace the 2025 proposal template (code change) | Before 21 December | Teams download it |
| Give judges view access to the Drive folder | Before 11 January | They read proposals there |
| Fix the home page wording after the prototype deadline (code change) | Before 6 February | It says "Finalists announced" from then, before the 27 February reveal |
| Ask department IT for a DMARC record; set the Cloudflare billing alert | When possible | Email delivery; cost warning |

## 3. Milestones

| When | Happens automatically | Organizers do by hand |
|---|---|---|
| 27 November to 18 December: registration | Confirmation emails; "forgot code" is unavailable until the portal opens | Check **Teams** and **Emails** daily. Resend a code from the team's details if asked |
| 18 December, 11:59 pm | Registration closes | To extend it, change **Settings** before this time |
| Before 21 December | Nothing | Replace the proposal template; announce when the portal opens |
| 21 December, 9:00 am | Team portal opens: login and proposal upload | Upload a real test proposal and check it in Drive (the first real upload from the server), then delete that team |
| 21 December to 11 January | "Proposal received" email on each upload | Watch **Emails**; remind teams without a proposal |
| 11 January, 11:59 pm | Proposal uploads lock | Export to Sheets or CSV for the judges |
| 12 to 20 January | Home page shows that the shortlist is announced on 20 January | Judge. Super admins tick teams under **Shortlist** (a draft: nothing is sent) |
| **Before 20 January, 6:00 pm** | Nothing | **Finalise** the shortlist. Shortlisted teams are emailed and their prototype upload opens. Other teams are not emailed; they see the result in the portal |
| 20 January, 6:00 pm | Home page moves to the prototype round, **whether or not you have finalised** | Announce the results |
| Until 6 February | "Prototype received" email on each submission | Remind shortlisted teams yourselves: the reminder email has no trigger |
| 6 February, 11:59 pm | Prototype links lock | Export and send to the judges |
| 17 February: semi-finalists | **Nothing**: the site has no semi-finalist stage or email | Choose and announce them yourselves |
| 27 February: finalists | Nothing | Super admins announce them under **Finalists**; each is emailed once |
| 27 to 28 March: finale | Home page changes with the dates | Publish results and photos (code change) |
| After the finale | Backups continue | Decide when to delete personal data and proposals |

### Changing dates

**Settings** changes three dates: registration closes, proposals due and prototypes due. A change shows on the public site at once. The registration opening, portal opening (`proposalOpens`), shortlist announcement, finale and the other timeline events are in the code (`src/content/deadlines.ts` and `src/content/timeline.ts`) and need a deploy.

### Shortlist rules

- It can be reopened only while no team has submitted a prototype.
- A team removed after being emailed gets no correction email: tell it yourselves.

## 4. What runs by itself

| Job | When |
|---|---|
| Email sending | About one every 2 seconds. Failures retry after 1 min, 5 min, 30 min, 2 h and 12 h, then show as failed |
| Continuous database copy (Litestream) | About every 10 seconds while data changes; 7 days kept |
| Nightly encrypted snapshot to R2 | 02:30; 90 days kept |
| Snapshot before a deploy | Every deploy; a failed copy stops the deploy |
| Expired logins removed | Daily |

## 5. Common tasks

| Task | How |
|---|---|
| Add an organizer | **Admins** (super admin) |
| Lost admin password | Another super admin resets it under **Admins**. If there is none, on the server: `pnpm admin:create <new username> "<Name>"` |
| Team lost its code | **Teams** → the team → resend code (sends the same code to the leader) |
| Wrong leader email | Correct it under **Teams**, then resend the code |
| Failed emails | **Emails** → fix the cause shown → **Retry**. A retry uses the original address |
| Delete a test team | On the server, below |

```bash
cd /var/www/sliot/SLIoT-Challenge-2025
pnpm team:delete SL27-XXXX-XXXX          # preview only
pnpm team:delete SL27-XXXX-XXXX --yes    # saves a copy of the database, then deletes
```

Afterwards delete that copy from `/var/lib/sliot` (it holds personal data), remove the listed Drive files and export to Sheets again. A team in a finalised shortlist can't be deleted. Deleted data stays in the backups until they expire.

## 6. Monitoring

### Uptime alerts

A server that is down can't report itself, so an outside service must check it. For example, [UptimeRobot](https://uptimerobot.com) (check that the terms of its free plan suit this use):

1. Create the account with `sliot@cse.mrt.ac.lk`.
2. Keyword monitor on `https://sliot.cse.mrt.ac.lk/api/health`: alert when `"status":"ok"` is missing. This covers the server, nginx, the app and the database.
3. A second keyword monitor on the same address: alert when `"failed":0` is missing, which means an email has failed.
4. Add the organizers as alert contacts and send a test alert.

healthchecks.io separately reports a missed or failed nightly snapshot. It doesn't watch site uptime or Litestream.

### Weekly check (daily near deadlines)

```bash
pm2 list
systemctl is-active nginx litestream pm2-hpc-16
df -h /
curl -s http://127.0.0.1:3000/api/health; echo
sudo certbot certificates
sudo journalctl -u litestream --since "7 days ago" -p warning --no-pager
```

Expect `sliot-web` online with a restart count (`↺`) that isn't climbing, three lines saying `active`, free disk space, `"status":"ok"`, more than 20 days left on the certificate, and no repeated Litestream errors.

### Monthly

Run the restore drill ([steps](../deploy/backup/README.md)) and compare the team count with the dashboard.

## 7. When something is wrong

| Problem | Do this |
|---|---|
| Site down | Run the weekly check. `pm2 logs sliot-web --lines 50 --nostream` shows errors |
| App not online | `pm2 restart sliot-web` |
| nginx not active | `sudo nginx -t`, then `sudo systemctl restart nginx` |
| Whole server unreachable | Contact department IT |
| Deploy failed | Don't push again. Read the failed step's log in GitHub Actions. To go back, revert the merge commit on `main` and push |
| Emails not sending | **Emails** shows the error. Check the `sliot@` app password |
| Data lost or damaged | Follow "Restoring for real" in the [backup guide](../deploy/backup/README.md). Don't improvise |

## 8. Testing shortlisting and later stages

Do it on a laptop, never on the live site. First empty `SMTP_PASSWORD` in `.env.local` so that no email goes out. `pnpm db:seed` starts after the shortlist, with prototypes already in, so it can't be used to try shortlisting; that needs test data in the earlier stage.
