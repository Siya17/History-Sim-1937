import { test } from "node:test";
import assert from "node:assert/strict";
import { initialState, execute, reconcile, score } from "../src/lib/classroom";
test("all ideology thresholds and partial bonuses", () => {
  const s = initialState();
  for (const [name, res, partial, full] of [
    ["Germany", "mil", 9, 10],
    ["UK", "econ", 9, 10],
    ["USSR", "pol", 8, 9],
  ] as const) {
    const c = s.countries.find((c) => c.name === name)!;
    c.mil = 0;
    c.econ = 0;
    c.pol = 0;
    c.dip = 0;
    c[res] = partial;
    assert.equal(score(c, s), 2);
    c[res] = full;
    assert.equal(score(c, s), 3);
  }
  const c = s.countries.find((c) => c.name === "Iran")!;
  c.econ = 6;
  c.mil = 3;
  c.dip = 6;
  assert.equal(score(c, s), 1);
  c.econ = 7;
  assert.equal(score(c, s), 2);
  c.econ = 8;
  c.mil = 5;
  assert.equal(score(c, s), 3);
  c.dip = 7;
  assert.equal(score(c, s), 4);
});
test("every country special matches its definition and is bounded", () => {
  for (const base of initialState().countries) {
    const s = initialState();
    s.phase = "RUNNING";
    s.round = 1;
    s.deadline = 10000;
    const c = s.countries.find((c) => c.name === base.name)!;
    const next = execute(
      s,
      { type: "ORDER", action: "SPECIAL", round: 1 },
      c.name,
      false,
      0,
      () => 1,
    ).countries.find((nextCountry) => nextCountry.name === c.name)!;
    assert.equal(next.used, 1);
    assert.equal(next.special, true);
    for (const res of ["econ", "mil", "pol", "dip"] as const)
      assert.ok(next[res] >= 0 && next[res] <= 15);
  }
});
test("tribute transfers add together and score after transfer", () => {
  const s = initialState();
  s.phase = "RUNNING";
  s.round = 1;
  s.deadline = 1000;
  const master = s.countries.find((c) => c.name === "UK")!;
  master.econ = 8;
  for (const name of ["Japan", "Italy"]) {
    const c = s.countries.find((c) => c.name === name)!;
    c.master = "UK";
    c.econ = 2;
  }
  const next = reconcile(s, 1001);
  assert.equal(next.countries.find((c) => c.name === "UK")!.econ, 10);
  assert.equal(next.summaries[0].scores.UK, 3);
});
test("stale teacher controls cannot close a newer round", () => {
  const s = initialState();
  s.phase = "RUNNING";
  s.round = 2;
  s.deadline = 10000;
  assert.throws(
    () => execute(s, { type: "CLOSE", round: 1 }, null, true, 0, () => 1),
    /Stale round/,
  );
});
test("occupied recovery failure still consumes cost and order", () => {
  const s = initialState();
  s.phase = "RUNNING";
  s.round = 1;
  s.deadline = 10000;
  const c = s.countries[0];
  c.master = "Japan";
  const before = c.pol;
  const next = execute(
    s,
    { type: "ORDER", action: "RESIST", round: 1 },
    c.name,
    false,
    0,
    () => 5,
  ).countries[0];
  assert.equal(next.master, "Japan");
  assert.equal(next.used, 1);
  assert.equal(next.pol, before - 2);
});
