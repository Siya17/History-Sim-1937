import { test } from "node:test";
import assert from "node:assert/strict";
import { initialState, execute } from "../src/lib/classroom";
import {
  themeFor,
  costs,
  goals,
  scoringBreakdown,
  ACTIONS,
} from "../src/lib/presentation";
import {
  createPractice,
  practiceBuild,
  practiceOffer,
  practiceAccept,
  practiceFinish,
} from "../src/lib/practice";
import { getNotices } from "../src/lib/notifications";
test("themes are stable across refresh and vary by round", () => {
  assert.deepEqual(
    themeFor("BUILD_MIL", "Germany", 1),
    themeFor("BUILD_MIL", "Germany", 1),
  );
  assert.notDeepEqual(
    themeFor("BUILD_MIL", "Germany", 1),
    themeFor("BUILD_MIL", "Germany", 2),
  );
});
test("landlocked countries never receive naval stories", () => {
  for (const country of ["Austria", "Czech"])
    for (let round = 0; round < 30; round++)
      assert.notEqual(themeFor("BUILD_MIL", country, round)?.art, "navy");
});
test("all actions have readable names and consequences", () => {
  for (const a of ACTIONS) {
    assert.ok(a.title.en && a.title.ja && a.result.en && a.result.ja);
    assert.doesNotMatch(a.result.en, /\b(Econ|Mil|Pol|Dip|VP|d6)\b/);
  }
});
test("visible development costs match executed costs", () => {
  for (const action of ACTIONS.filter((a) => a.id.startsWith("BUILD_"))) {
    const s = initialState();
    s.phase = "RUNNING";
    s.round = 1;
    s.deadline = 10000;
    const c = s.countries[0];
    const expected = costs(action.id, c);
    const next = execute(
      s,
      { type: "ORDER", action: action.id, round: 1 },
      c.name,
      false,
      1,
      (n) => n,
    ).countries[0];
    for (const [r, n] of Object.entries(expected))
      assert.equal(
        next[r as "econ" | "mil" | "pol" | "dip"],
        c[r as "econ" | "mil" | "pol" | "dip"] - n!,
      );
  }
});
test("practice is isolated and the video numbers agree", () => {
  const real = initialState(),
    before = JSON.stringify(real),
    demo = createPractice();
  let s = practiceBuild(demo.state, demo.name);
  assert.equal(s.countries.find((c) => c.name === "UK")!.econ, 10);
  assert.equal(s.countries.find((c) => c.name === "UK")!.dip, 5);
  s = practiceOffer(s, demo.name, demo.other);
  s = practiceAccept(s, demo.name);
  const c = s.countries.find((c) => c.name === "UK")!;
  assert.equal(c.econ, 11);
  assert.equal(c.dip, 4);
  assert.equal(c.used, 2);
  s = practiceFinish(s);
  assert.equal(s.summaries[0].scores.UK, 3);
  assert.equal(JSON.stringify(real), before);
  assert.equal(demo.state.countries.find((c) => c.name === "UK")!.used, 0);
});
test("every country can finish the practice", () => {
  for (const country of initialState().countries) {
    const d = createPractice(country.name);
    let s = practiceBuild(d.state, d.name);
    s = practiceOffer(s, d.name, d.other);
    s = practiceFinish(practiceAccept(s, d.name));
    assert.equal(s.phase, "FINISHED");
    assert.equal(s.countries.find((c) => c.name === d.name)!.used, 2);
    assert.equal(scoringBreakdown(country, 0).survival, 1);
    assert.ok(goals(country).primary.en);
  }
});
test("offers notify only the recipient and stop after a response", () => {
  let s = initialState();
  s.phase = "RUNNING";
  s.round = 1;
  s.deadline = 10000;
  s = execute(
    s,
    { type: "PROPOSE", action: "TRADE", target: "UK", round: 1 },
    "Germany",
    false,
    1,
    (n) => n,
  );
  assert.equal(
    getNotices(s, "UK", "en").filter((n) => n.kind === "offer").length,
    1,
  );
  assert.equal(getNotices(s, "Japan", "en").length, 0);
  s = execute(
    s,
    { type: "ACCEPT", proposalId: s.proposals[0].id, round: 1 },
    "UK",
    false,
    2,
    (n) => n,
  );
  assert.equal(
    getNotices(s, "UK", "en").filter((n) => n.kind === "offer").length,
    0,
  );
});
