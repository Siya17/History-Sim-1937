import { INITIAL_COUNTRIES, type ResourceType } from "./gameEngine";
export const BUILD_RULES: Record<
  string,
  { cost: ResourceType; gain: ResourceType; amount: number; threshold: number }
> = {
  BUILD_ECON: { cost: "dip", gain: "econ", amount: 2, threshold: 4 },
  BUILD_MIL: { cost: "econ", gain: "mil", amount: 2, threshold: 4 },
  BUILD_POL: { cost: "mil", gain: "pol", amount: 2, threshold: 5 },
  BUILD_DIP: { cost: "pol", gain: "dip", amount: 2, threshold: 5 },
};
export const TRADE_COST = 1;
export function allianceCost(a: string, b: string) {
  const x = INITIAL_COUNTRIES.find((c) => c.name_en === a)!.ideology,
    y = INITIAL_COUNTRIES.find((c) => c.name_en === b)!.ideology;
  return x === y || x.includes("Neutral") || y.includes("Neutral") ? 1 : 2;
}
export type Scorable = {
  name: string;
  econ: number;
  mil: number;
  pol: number;
  dip: number;
  master: string | null;
};
export function scoringBreakdown(c: Scorable, allies: number) {
  const ideology = INITIAL_COUNTRIES.find(
    (d) => d.name_en === c.name,
  )!.ideology;
  let primary = 0,
    secondary = 0;
  if (!c.master) {
    if (ideology.includes("Fascist")) {
      primary = c.mil >= 10 ? 2 : c.mil >= 9 ? 1 : 0;
      secondary = allies >= 3 ? 1 : 0;
    }
    if (ideology.includes("Liberal")) {
      primary = c.econ >= 10 ? 2 : c.econ >= 9 ? 1 : 0;
      secondary = allies >= 3 ? 1 : 0;
    }
    if (ideology.includes("Communist")) {
      primary = c.pol >= 9 ? 2 : c.pol >= 8 ? 1 : 0;
      secondary = c.mil >= 8 ? 1 : 0;
    }
    if (ideology.includes("Neutral")) {
      primary =
        c.econ >= 8 && c.mil >= 5 ? 2 : c.econ >= 7 || c.mil >= 4 ? 1 : 0;
      secondary = c.dip >= 7 ? 1 : 0;
    }
  }
  return { survival: 1, primary, secondary, total: 1 + primary + secondary };
}
export class RuleError extends Error {
  code: string;
  params: Record<string, string | number>;
  constructor(
    message: string,
    code = "ACTION_UNAVAILABLE",
    params: Record<string, string | number> = {},
  ) {
    super(message);
    this.code = code;
    this.params = params;
  }
}
