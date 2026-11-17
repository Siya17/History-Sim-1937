import { initialState, execute, type State } from "./classroom";
import { goals } from "./presentation";
export function createPractice(name = "UK") {
  const state = initialState(1);
  const other = name === "UK" ? "France" : "UK";
  state.countries = state.countries.filter(
    (c) => c.name === name || c.name === other,
  );
  state.phase = "RUNNING";
  state.round = 1;
  state.deadline = 999999999;
  return { state, name, other };
}
export function practiceBuild(state: State, name: string) {
  return execute(
    state,
    {
      type: "ORDER",
      action: goals(state.countries.find((c) => c.name === name)!).practice,
      round: 1,
    },
    name,
    false,
    100001,
    (n) => n,
  );
}
export function practiceOffer(state: State, name: string, other: string) {
  return execute(
    state,
    { type: "PROPOSE", action: "TRADE", target: name, round: 1 },
    other,
    false,
    100002,
    (n) => n,
  );
}
export function practiceAccept(state: State, name: string) {
  return execute(
    state,
    { type: "ACCEPT", proposalId: state.proposals[0].id, round: 1 },
    name,
    false,
    100003,
    (n) => n,
  );
}
export function practiceFinish(state: State) {
  return execute(
    state,
    { type: "CLOSE", round: 1 },
    null,
    true,
    100004,
    (n) => n,
  );
}
