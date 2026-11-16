# 1937 Classroom

A hosted English/Japanese classroom diplomacy game. Next.js 16, React 19, Prisma 7, PostgreSQL, Better Auth. The Python/Google Sheets implementation in the repository root remains a legacy reference.

## Local setup

Use Node.js 22.12+ (or a supported newer LTS) and PostgreSQL 17. From `webapp`:

```powershell
Copy-Item .env.example .env
# Edit .env: PostgreSQL URL, unique random auth secret, public app URL.
npm ci
docker compose up -d
npm run db:migrate
$env:TEACHER_EMAIL = 'teacher@example.com'
$env:TEACHER_PASSWORD = 'a-unique-password-at-least-12-characters'
npm run teacher:setup
Remove-Item Env:TEACHER_PASSWORD
npm run dev
```

Open http://localhost:3000. Public registration is disabled. `teacher:setup` creates an account or resets an existing account's password and revokes its sessions. Teachers can also change passwords in their workspace. No email delivery service is required. Never save bootstrap passwords in committed files or deployment settings.

To test without Docker, `npm run test:db` starts a native PostgreSQL test server at port 55433. Set `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55433/postgres` in the shell that runs migrations, teacher setup, and the app. Run `npm run db:migrate` before setup. Each fixture run creates a new database directory under ignored `.test-postgres`; it is a development fixture, not the production database. Stop it with Ctrl+C. Data is retained for inspection.

## Classroom flow

1. Teacher signs in and creates a room (1–12 rounds, 60–900 seconds; defaults 9 and 420).
2. Teams join with a room code and country. Save the displayed team code; teammates use it to join the same country from another device.
3. Teacher starts with at least two claimed countries. Unclaimed countries are excluded. Joining closes; team rejoining continues.
4. Each country shares two orders per round. Students negotiate face to face and propose treaties through the app. Both sides pay only when accepted.
5. Expiry closes and scores the round, then waits for the teacher's debrief. Pausing preserves remaining time. Closing early requires confirmation.
6. After the final round, review joint rankings, export CSV/JSON, archive, or create a fresh rematch.

Use the teacher tab to rotate team codes (revokes all that team's devices), remove a team before starting, adjust resources/VP with a reason, and control progression. Projection mode hides teacher controls and team secrets. It is a display mode on the authenticated teacher's browser, not an administrative access mechanism.

## Rules v2

The authoritative engine and bilingual action reference live in `src/lib/classroom.ts`. Country definitions and world events are in `src/lib/gameEngine.ts`. Costs, development probabilities, two shared orders, accepted treaties, occupation, liberation, tribute and scoring are covered by engine tests. Trade and alliance acceptance has no dice roll. Invalid orders cost nothing; valid failed rolls spend an order. Accepted treaties spend one order for each side. Pending treaties reserve nothing and expire at round close.

Occupied teams can rebuild or resist. Every team earns survival VP; independent teams also earn ideology bonuses. Resource gains cap at 15; VP is uncapped. Results are immutable after finishing. Historical labels are simplified teaching abstractions.

## Persistence and trust boundary

A game's canonical state is a versioned JSON snapshot. Related teams, sessions, commands, events, completed rounds, alliances and treaty proposals have relational records. Every room operation locks its PostgreSQL game row in a transaction. Normalized relationship records and snapshots update atomically. This deliberately serializes a small classroom's game commands and works across Vercel instances.

Device tokens and team codes are stored as hashes. Country ownership comes from an HTTP-only cookie, never a URL or actor ID. Teacher sessions use Better Auth. State responses contain no credentials. Pending offers are visible only to their parties and teacher; accepted agreements and game outcomes are public within the room.

Commands carry a request UUID and intended round. Their result is persisted, so replay cannot spend resources twice. The browser retains an interrupted request in session storage and offers a safe retry. On an expired deadline, the next authorized room request settles the round once at the recorded deadline. With every browser offline, settlement is deferred until reconnection; expired orders still cannot execute. No cron or always-running timer is needed.

## Verification

```powershell
npm test
npm run typecheck
npm run lint
npm run build
# Requires a running, migrated PostgreSQL test database and bootstrapped teacher:
npx playwright install chromium
npm run test:e2e
```

The browser tests use `TEACHER_EMAIL` and `TEACHER_PASSWORD` against an isolated test database. They create and delete rehearsal rooms. Never point them at production. CI runs them against PostgreSQL 17. The native local fixture and CI both support concurrent PostgreSQL connections. CI uses PostgreSQL 17.

## Vercel and Neon

- Import the repository with Vercel project root `webapp`.
- Add Neon PostgreSQL using the Vercel Marketplace. Put app and database in nearby regions.
- Configure `DATABASE_URL`, `BETTER_AUTH_SECRET` (32+ random characters) and `BETTER_AUTH_URL` (the canonical HTTPS deployment URL). Production cookies require HTTPS.
- Provision a separate database/Neon branch for previews. Never supply production credentials to previews or untrusted pull requests.
- Run `npm run db:migrate` against the target database as the controlled migration step before promoting a deployment. The normal build generates Prisma Client and builds Next.js; it does not alter production data.
- Run the teacher bootstrap locally against that database once; remove its password environment variable afterward.
- Verify `/api/health`, create a rehearsal room, join on two devices, finish a short game, export results and test reconnection before class.
- Set provider spending limits and review request/database usage during the rehearsal. No hosting account or paid resource is created by repository setup.

## Backups and recovery

Enable provider backups with a retention period suited to your course. Before migrations and important classes, take a PostgreSQL custom-format backup using `pg_dump --format=custom --file=classroom.backup` with a direct database connection. Keep this encrypted and outside the repository. The teacher's JSON/CSV exports are useful classroom records but do not include login credentials or device sessions and are **not a full database backup**.

Restore with `pg_restore --no-owner --dbname=<separate-test-database> classroom.backup`, then run a preview deployment against that restored database. Confirm teacher login, game history, round summaries and a rejoining team before declaring recovery successful. Never rehearse restoration into the live database. Restore checks and a live classroom rehearsal remain deployment responsibilities.

## Verification record

See [VERIFICATION.md](VERIFICATION.md) for the executed checks, workload, results and deployment boundaries. The local backup rehearsal can be repeated with `npx tsx scripts/rehearse-backup.ts` against the native fixture on port 55433 after teacher setup. It creates a completed test game, restores a snapshot into a separate temporary database, checks the restored state and cleans up its own test game/database. Its ignored backup file contains test authentication records and must not be published.

## Operational notes

`GET /api/health` returns a boolean database health result. Failed API operations log a random correlation identifier and error class, without credentials. The app uses short HTTP polling (2.5 seconds while running, 10 seconds otherwise), so no persistent WebSocket server is needed.

Archive retains results. Permanent deletion requires typing the room code and removes only the owning teacher's selected game and related records. There is no automatic deletion policy. Rotate team access when sharing a device or recovering a lost team code.
