import { initialState, execute } from "../src/lib/classroom";
import { isDeepStrictEqual } from "node:util";
import { Client } from "pg";
import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
const tables = [
  "User",
  "Session",
  "Account",
  "Verification",
  "Game",
  "Team",
  "DeviceSession",
  "ProcessedCommand",
  "GameEvent",
  "Round",
  "Alliance",
  "Proposal",
  "RateLimit",
];
async function main() {
  const url = new URL(process.env.DATABASE_URL ?? "");
  if (url.hostname !== "127.0.0.1" || url.port !== "55433")
    throw new Error(
      "This rehearsal only runs against the native local test fixture on 55433.",
    );
  const source = new Client({ connectionString: url.toString() });
  await source.connect();
  const fixtureId = randomUUID();
  const user = await source.query('SELECT id FROM "User" LIMIT 1');
  if (!user.rows.length) throw new Error("Bootstrap the test teacher first.");
  let state = initialState(1);
  state.countries = state.countries.slice(0, 2);
  const now = Date.now();
  state = execute(state, { type: "START" }, null, true, now, () => 1);
  state = execute(
    state,
    { type: "PROPOSE", action: "ALLIANCE", target: "Japan", round: 1 },
    "Germany",
    false,
    now + 1,
    () => 1,
  );
  state = execute(
    state,
    { type: "ACCEPT", proposalId: state.proposals[0].id, round: 1 },
    "Japan",
    false,
    now + 2,
    () => 1,
  );
  state = execute(
    state,
    { type: "ORDER", action: "SPECIAL", round: 1 },
    "Germany",
    false,
    now + 3,
    () => 1,
  );
  state = execute(state, { type: "CLOSE" }, null, true, now + 4, () => 1);
  await source.query(
    'INSERT INTO "Game" (id,"roomCode",title,"teacherId",state,"updatedAt") VALUES ($1,$2,$3,$4,$5,$6)',
    [
      fixtureId,
      "RESTORE-" + fixtureId.slice(0, 8),
      "Backup rehearsal",
      user.rows[0].id,
      state,
      new Date(),
    ],
  );
  for (const c of state.countries)
    await source.query(
      'INSERT INTO "Team" (id,"gameId",country,name,"codeHash") VALUES ($1,$2,$3,$4,$5)',
      [randomUUID(), fixtureId, c.name, c.name, "test-fixture-only"],
    );
  for (const e of state.events)
    await source.query(
      'INSERT INTO "GameEvent" (id,"gameId",sequence,round,"createdAt",category,message) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [
        randomUUID(),
        fixtureId,
        e.sequence,
        e.round,
        new Date(e.at),
        e.category,
        e,
      ],
    );
  await source.query(
    'INSERT INTO "Round" (id,"gameId",number,summary) VALUES ($1,$2,1,$3)',
    [randomUUID(), fixtureId, state.summaries[0]],
  );
  await source.query(
    'INSERT INTO "Alliance" (id,"gameId","countryA","countryB") VALUES ($1,$2,$3,$4)',
    [randomUUID(), fixtureId, "Germany", "Japan"],
  );
  const proposal = state.proposals[0];
  await source.query(
    'INSERT INTO "Proposal" (id,"gameId",sender,recipient,kind,round,status) VALUES ($1,$2,$3,$4,$5,1,$6)',
    [
      fixtureId + proposal.id,
      fixtureId,
      proposal.from,
      proposal.to,
      proposal.kind,
      proposal.status,
    ],
  );
  const snapshot: {
    table: string;
    columns: string[];
    rows: Record<string, unknown>[];
  }[] = [];
  await source.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
  for (const table of tables) {
    const result = await source.query('SELECT * FROM "' + table + '"');
    snapshot.push({
      table,
      columns: result.fields.map((f) => f.name),
      rows: result.rows,
    });
  }
  await source.query("COMMIT");
  await writeFile(
    ".test-postgres/backup-rehearsal.json",
    JSON.stringify(snapshot),
  );
  const restored = JSON.parse(
    await readFile(".test-postgres/backup-rehearsal.json", "utf8"),
  ) as typeof snapshot;
  const name = "restore_" + randomUUID().replaceAll("-", "");
  await source.query('CREATE DATABASE "' + name + '"');
  url.pathname = "/" + name;
  const target = new Client({ connectionString: url.toString() });
  await target.connect();
  try {
    await target.query(
      await readFile(
        "prisma/migrations/202611170001_classroom/migration.sql",
        "utf8",
      ),
    );
    await target.query("BEGIN");
    for (const block of restored) {
      if (!tables.includes(block.table))
        throw new Error("Unexpected backup table");
      for (const row of block.rows) {
        await target.query(
          'INSERT INTO "' +
            block.table +
            '" (' +
            block.columns.map((c) => '"' + c + '"').join(",") +
            ") VALUES (" +
            block.columns.map((_, i) => "$" + (i + 1)).join(",") +
            ")",
          block.columns.map((c) => row[c]),
        );
      }
    }
    await target.query("COMMIT");
    for (const block of snapshot) {
      const result = await target.query(
        'SELECT COUNT(*)::int AS n FROM "' + block.table + '"',
      );
      if (result.rows[0].n !== block.rows.length)
        throw new Error("Restore count mismatch");
    }
    const checked = await target.query('SELECT state FROM "Game" WHERE id=$1', [
      fixtureId,
    ]);
    if (!isDeepStrictEqual(checked.rows[0].state, state))
      throw new Error("Game history did not restore exactly");
    console.log(
      "Backup and restore verified: " +
        snapshot.reduce((n, t) => n + t.rows.length, 0) +
        " records across " +
        tables.length +
        " tables.",
    );
  } finally {
    await target.end();
    await source.query('DROP DATABASE "' + name + '"');
    await source.query('DELETE FROM "Game" WHERE id=$1', [fixtureId]);
    await source.end();
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
