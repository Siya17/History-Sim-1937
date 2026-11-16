import EmbeddedPostgres from "embedded-postgres";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
async function main() {
  const pg = new EmbeddedPostgres({
    databaseDir: resolve(".test-postgres", randomUUID()),
    user: "postgres",
    password: "postgres",
    port: 55433,
    persistent: true,
    autoRehydrateSymlinks: true,
  });
  await pg.initialise();
  await pg.start();
  console.log(
    "Native PostgreSQL test server ready on 55433. Run db:migrate and teacher:setup. Data stays under .test-postgres.",
  );
  process.on("SIGINT", async () => {
    await pg.stop();
    process.exit(0);
  });
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
