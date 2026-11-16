import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  execute,
  reconcile,
  score,
  type State,
  type Command,
} from "../src/lib/classroom";
const now = 100000;
function running() {
  const s = initialState();
  s.countries = s.countries.filter((c) =>
    ["Germany", "Japan", "UK", "USA"].includes(c.name),
  );
  s.phase = "RUNNING";
  s.round = 1;
  s.deadline = now + 10000;
  return s;
}
function act(
  s: State,
  cmd: Command,
  actor = "Germany",
  dice = (n: number) => n,
) {
  return execute(s, { ...cmd, round: s.round }, actor, false, now, dice);
}
test("14 countries and fixed version", () => {
  assert.equal(initialState().countries.length, 14);
  assert.equal(initialState().rulesVersion, "classroom-v2");
});
test("development thresholds and costs", () => {
  for (const [action, resource, cost, threshold] of [
    ["BUILD_ECON", "econ", "dip", 4],
    ["BUILD_MIL", "mil", "econ", 4],
    ["BUILD_POL", "pol", "mil", 5],
    ["BUILD_DIP", "dip", "pol", 5],
  ] as const) {
    for (const draw of [threshold - 1, threshold]) {
      const s = running(),
        before = s.countries[0],
        next = act(s, { type: "ORDER", action }, "Germany", () => draw)
          .countries[0];
      assert.equal(
        next[resource],
        before[resource] + (draw >= threshold ? 2 : 1),
      );
      assert.equal(next[cost], before[cost] - 2);
      assert.equal(next.used, 1);
    }
  }
});
test("two orders shared and no third", () => {
  let s = running();
  s = act(s, { type: "ORDER", action: "BUILD_MIL" });
  s = act(s, { type: "ORDER", action: "SPECIAL" });
  assert.throws(
    () => act(s, { type: "ORDER", action: "BUILD_POL" }),
    /No orders/,
  );
});
test("invalid action cannot modify input", () => {
  const s = running(),
    before = structuredClone(s);
  assert.throws(() =>
    act(s, { type: "ORDER", action: "WAR", target: "Germany" }),
  );
  assert.deepEqual(s, before);
});
test("special once only", () => {
  const s = act(running(), { type: "ORDER", action: "SPECIAL" });
  assert.equal(s.countries[0].mil, 10);
  assert.throws(
    () => act(s, { type: "ORDER", action: "SPECIAL" }),
    /already used/,
  );
});
test("trade requires mutual acceptance and charges both", () => {
  let s = act(running(), { type: "PROPOSE", action: "TRADE", target: "UK" });
  assert.equal(s.countries[0].used, 0);
  const p = s.proposals[0];
  s = act(s, { type: "ACCEPT", proposalId: p.id }, "UK");
  assert.equal(s.countries[0].used, 1);
  assert.equal(s.countries.find((c) => c.name === "UK")!.used, 1);
  assert.equal(s.countries[0].econ, 7);
  assert.throws(() => act(s, { type: "ACCEPT", proposalId: p.id }, "UK"));
});
test("proposal cannot be accepted by its sender", () => {
  const s = act(running(), { type: "PROPOSE", action: "TRADE", target: "UK" });
  assert.throws(
    () => act(s, { type: "ACCEPT", proposalId: s.proposals[0].id }),
    /not yours/,
  );
});
test("accept revalidates resources without partial mutation", () => {
  const s = act(running(), { type: "PROPOSE", action: "TRADE", target: "UK" });
  s.countries[0].dip = 0;
  const before = structuredClone(s);
  assert.throws(() =>
    act(s, { type: "ACCEPT", proposalId: s.proposals[0].id }, "UK"),
  );
  assert.deepEqual(s, before);
});
test("only one trade per pair per round", () => {
  let s = act(running(), { type: "PROPOSE", action: "TRADE", target: "UK" });
  s = act(s, { type: "ACCEPT", proposalId: s.proposals[0].id }, "UK");
  s = act(s, { type: "PROPOSE", action: "TRADE", target: "UK" });
  assert.throws(
    () => act(s, { type: "ACCEPT", proposalId: s.proposals[1].id }, "UK"),
    /Already traded/,
  );
});
test("alliance is bilateral and cannot be attacked", () => {
  let s = act(running(), {
    type: "PROPOSE",
    action: "ALLIANCE",
    target: "Japan",
  });
  s = act(s, { type: "ACCEPT", proposalId: s.proposals[0].id }, "Japan");
  assert.deepEqual(s.alliances, [["Germany", "Japan"]]);
  assert.throws(
    () => act(s, { type: "ORDER", action: "WAR", target: "Japan" }),
    /Break your alliance/,
  );
});
test("war uses military after cost and ties favor defender", () => {
  const s = running();
  s.countries[1].mil = 6;
  const next = act(
    s,
    { type: "ORDER", action: "WAR", target: "Japan" },
    "Germany",
    () => 1,
  );
  assert.equal(next.countries[0].mil, 4);
  assert.equal(next.countries[1].vp, 2);
});
test("conquest dissolves both sides of alliance and frees puppets", () => {
  const s = running();
  s.countries[1].mil = 1;
  s.countries[1].econ = 2;
  s.countries[2].master = "Japan";
  s.alliances = [["Japan", "USA"]];
  const next = act(s, { type: "ORDER", action: "WAR", target: "Japan" });
  assert.equal(next.countries[1].master, "Germany");
  assert.equal(next.countries[2].master, null);
  assert.equal(next.countries[0].vp, 5);
  assert.equal(next.alliances.length, 0);
});
test("occupied team can rebuild and resist", () => {
  const s = running();
  s.countries[0].master = "Japan";
  s.countries[0].pol = 1;
  let next = act(s, { type: "ORDER", action: "REBUILD" });
  assert.equal(next.countries[0].pol, 2);
  next = act(next, { type: "ORDER", action: "RESIST" });
  assert.equal(next.countries[0].master, null);
  assert.equal(next.countries[0].used, 2);
});
test("occupied team cannot use ordinary actions", () => {
  const s = running();
  s.countries[0].master = "Japan";
  assert.throws(() => act(s, { type: "ORDER", action: "SPECIAL" }), /Occupied/);
});
test("deadline closes exactly once at effective deadline", () => {
  const s = running();
  const next = reconcile(s, now + 20000);
  assert.equal(next.phase, "BETWEEN_ROUNDS");
  assert.equal(next.summaries[0].at, s.deadline);
  assert.deepEqual(reconcile(next, now + 30000), next);
  assert.throws(() =>
    execute(
      s,
      { type: "ORDER", action: "SPECIAL", round: 1 },
      "Germany",
      false,
      now + 20000,
      () => 1,
    ),
  );
});
test("pause and resume preserve time", () => {
  let s = execute(
    running(),
    { type: "PAUSE" },
    null,
    true,
    now + 2000,
    () => 1,
  );
  assert.equal(s.remaining, 8);
  s = execute(s, { type: "RESUME" }, null, true, now + 90000, () => 1);
  assert.equal(s.deadline, now + 98000);
});
test("teacher commands require teacher authorization", () => {
  assert.throws(() => act(running(), { type: "CLOSE" }), /Teacher/);
});
test("final round closes to immutable results", () => {
  const s = running();
  s.totalRounds = 1;
  const next = reconcile(s, now + 20000);
  assert.equal(next.phase, "FINISHED");
  assert.throws(() =>
    execute(next, { type: "START" }, null, true, now, () => 1),
  );
  assert.throws(() =>
    execute(
      next,
      {
        type: "ADJUST",
        target: "Germany",
        resource: "vp",
        delta: 1,
        reason: "x",
      },
      null,
      true,
      now,
      () => 1,
    ),
  );
});
test("scoring includes occupied survival and uncapped VP", () => {
  const s = running();
  s.countries[0].mil = 10;
  assert.equal(score(s.countries[0], s), 3);
  s.countries[0].master = "Japan";
  assert.equal(score(s.countries[0], s), 1);
  s.countries[0].vp = 50;
  assert.ok(reconcile(s, now + 20000).countries[0].vp > 50);
});
test("round one event applied once, no event on resume", () => {
  let s = initialState(2);
  s.countries = s.countries.slice(0, 2);
  const initial = s.countries[0].econ;
  s = execute(s, { type: "START" }, null, true, now, () => 1);
  assert.equal(s.countries[0].econ, initial - 1);
  s = execute(s, { type: "PAUSE" }, null, true, now, () => 1);
  s = execute(s, { type: "RESUME" }, null, true, now, () => 1);
  assert.equal(s.countries[0].econ, initial - 1);
});
test("seeded nine-round game completes with bounded resources", () => {
  let seed = 4;
  const dice = (n: number) => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return (seed % n) + 1;
  };
  let s = initialState();
  for (let round = 1; round <= 9; round++) {
    s = execute(s, { type: "START" }, null, true, now, dice);
    for (const c of [...s.countries])
      for (let j = 0; j < 2; j++) {
        try {
          s = act(s, { type: "ORDER", action: "BUILD_ECON" }, c.name, dice);
        } catch {}
      }
    s = execute(s, { type: "CLOSE" }, null, true, now + 1, dice);
  }
  assert.equal(s.phase, "FINISHED");
  assert.equal(s.summaries.length, 9);
  for (const c of s.countries)
    for (const r of ["econ", "mil", "pol", "dip"] as const)
      assert.ok(c[r] >= 0 && c[r] <= 15);
});
