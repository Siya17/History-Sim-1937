import { INITIAL_COUNTRIES, EVENT_DECK, type ResourceType } from "./gameEngine";
export type Phase =
  "LOBBY" | "RUNNING" | "PAUSED" | "BETWEEN_ROUNDS" | "FINISHED" | "ARCHIVED";
export type Localized = { en: string; ja: string };
export type Country = {
  name: string;
  econ: number;
  mil: number;
  pol: number;
  dip: number;
  vp: number;
  used: number;
  special: boolean;
  master: string | null;
};
export type Proposal = {
  id: string;
  from: string;
  to: string;
  kind: "TRADE" | "ALLIANCE";
  round: number;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED" | "EXPIRED";
};
export type Event = {
  sequence: number;
  round: number;
  at: number;
  category: string;
  message: Localized;
  draws: number[];
  command?: Command;
  changes?: { country: string; before: Country; after: Country }[];
};
export type Summary = {
  round: number;
  at: number;
  scores: Record<string, number>;
  resources: Record<string, Country>;
};
export type State = {
  rulesVersion: "classroom-v2";
  phase: Phase;
  round: number;
  totalRounds: number;
  duration: number;
  deadline: number | null;
  remaining: number;
  locked: boolean;
  countries: Country[];
  alliances: [string, string][];
  proposals: Proposal[];
  events: Event[];
  summaries: Summary[];
  event: string | null;
};
export type Command = {
  type: string;
  action?: string;
  target?: string;
  proposalId?: string;
  resource?: string;
  delta?: number;
  reason?: string;
  round?: number;
};
export const RESOURCES: ResourceType[] = ["econ", "mil", "pol", "dip"];
export const ORDERS = [
  ["BUILD_ECON", "Industry", "産業育成", "2 Dip → +1/+2 Econ · 70% full"],
  ["BUILD_MIL", "Rearmament", "軍備拡張", "2 Econ → +1/+2 Mil · 70% full"],
  ["BUILD_POL", "Rally", "国民結集", "2 Mil → +1/+2 Pol · 60% full"],
  ["BUILD_DIP", "Diplomatic corps", "外交工作", "2 Pol → +1/+2 Dip · 60% full"],
  [
    "TRADE",
    "Propose trade",
    "通商提案",
    "Mutual acceptance: 1 order + 1 Dip each → +1 Econ each",
  ],
  [
    "ALLIANCE",
    "Propose alliance",
    "同盟提案",
    "Mutual acceptance: 1 order + 1–2 Dip each → +1 Pol each · max 3 allies",
  ],
  ["BREAK", "Break alliance", "同盟破棄", "1 order + 2 Pol · guaranteed"],
  [
    "SPY",
    "Sabotage",
    "破壊工作",
    "2 Dip · 40%: target −1 random resource; fail: −1 Pol",
  ],
  [
    "WAR",
    "Attack",
    "軍事侵攻",
    "2 Mil + 1 Pol · post-cost Mil + d6 + allies (max +4)",
  ],
  ["SPECIAL", "Special power", "国家特殊能力", "Once per game · 1 order"],
  ["REBUILD", "Rebuild", "復興", "Occupied only · +2 Econ and +1 Pol"],
  [
    "RESIST",
    "Resist occupation",
    "抵抗運動",
    "Occupied only · 2 Pol · 50% independence",
  ],
] as const;
export function initialState(totalRounds = 9, duration = 420): State {
  return {
    rulesVersion: "classroom-v2",
    phase: "LOBBY",
    round: 0,
    totalRounds,
    duration,
    deadline: null,
    remaining: duration,
    locked: false,
    countries: INITIAL_COUNTRIES.map((c) => ({
      name: c.name_en,
      econ: c.econ,
      mil: c.mil,
      pol: c.pol,
      dip: c.dip,
      vp: 0,
      used: 0,
      special: false,
      master: null,
    })),
    alliances: [],
    proposals: [],
    events: [],
    summaries: [],
    event: null,
  };
}
function requireRule(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}
function mod(c: Country, r: ResourceType, n: number) {
  c[r] = Math.max(0, Math.min(15, c[r] + n));
}
function cost(c: Country, r: ResourceType, n: number) {
  requireRule(c[r] >= n, `Insufficient ${r}: need ${n} / 資源不足`);
  mod(c, r, -n);
}
function order(c: Country) {
  requireRule(c.used < 2, "No orders remaining / 行動回数の上限です");
  c.used++;
}
export function allies(s: State, name: string) {
  return s.alliances
    .filter((p) => p.includes(name))
    .map((p) => p.find((n) => n !== name)!);
}
function independent(c: Country) {
  requireRule(!c.master, "Country is occupied / 占領中です");
}
function cancelTreaties(s: State, name: string) {
  s.alliances = s.alliances.filter((p) => !p.includes(name));
  s.proposals
    .filter((p) => p.status === "PENDING" && (p.from === name || p.to === name))
    .forEach((p) => (p.status = "CANCELLED"));
}
function free(c: Country) {
  c.master = null;
  c.econ = Math.max(3, c.econ);
  c.mil = Math.max(3, c.mil);
}
export function score(c: Country, s: State) {
  if (c.master) return 1;
  const ideology = INITIAL_COUNTRIES.find(
    (d) => d.name_en === c.name,
  )!.ideology;
  let gain = 1;
  if (ideology.includes("Fascist"))
    gain +=
      (c.mil >= 10 ? 2 : c.mil >= 9 ? 1 : 0) +
      (allies(s, c.name).length >= 3 ? 1 : 0);
  if (ideology.includes("Liberal"))
    gain +=
      (c.econ >= 10 ? 2 : c.econ >= 9 ? 1 : 0) +
      (allies(s, c.name).length >= 3 ? 1 : 0);
  if (ideology.includes("Communist"))
    gain += (c.pol >= 9 ? 2 : c.pol >= 8 ? 1 : 0) + (c.mil >= 8 ? 1 : 0);
  if (ideology.includes("Neutral"))
    gain +=
      (c.econ >= 8 && c.mil >= 5 ? 2 : c.econ >= 7 || c.mil >= 4 ? 1 : 0) +
      (c.dip >= 7 ? 1 : 0);
  return gain;
}
export function closeRound(s: State, now: number) {
  if (s.phase !== "RUNNING" && s.phase !== "PAUSED") return;
  s.proposals
    .filter((p) => p.status === "PENDING")
    .forEach((p) => (p.status = "EXPIRED"));
  const transfers = new Map<string, number>();
  for (const c of s.countries)
    if (c.master && c.econ > 1) {
      transfers.set(c.name, (transfers.get(c.name) ?? 0) - 1);
      transfers.set(c.master, (transfers.get(c.master) ?? 0) + 1);
    }
  for (const c of s.countries) mod(c, "econ", transfers.get(c.name) ?? 0);
  const scores: Record<string, number> = {};
  for (const c of s.countries) {
    scores[c.name] = score(c, s);
    c.vp += scores[c.name];
  }
  s.summaries.push({
    round: s.round,
    at: now,
    scores,
    resources: Object.fromEntries(s.countries.map((c) => [c.name, { ...c }])),
  });
  s.phase = s.round >= s.totalRounds ? "FINISHED" : "BETWEEN_ROUNDS";
  s.deadline = null;
  s.remaining = 0;
  s.events.push({
    sequence: s.events.length + 1,
    round: s.round,
    at: now,
    category: "ROUND",
    message: {
      en: "Round closed. Review the scoring summary.",
      ja: "ラウンド終了。得点を確認してください。",
    },
    draws: [],
  });
}
export function reconcile(state: State, now: number): State {
  const s = structuredClone(state);
  if (s.phase === "RUNNING" && s.deadline !== null && now >= s.deadline)
    closeRound(s, s.deadline);
  return s;
}
export function execute(
  state: State,
  cmd: Command,
  actor: string | null,
  teacher: boolean,
  now: number,
  dice: (sides: number) => number,
): State {
  const s = reconcile(state, now);
  const draws: number[] = [];
  const roll = (sides: number) => {
    const n = dice(sides);
    requireRule(
      Number.isInteger(n) && n >= 1 && n <= sides,
      "Invalid random draw",
    );
    draws.push(n);
    return n;
  };
  const log = (en: string, ja: string, category = "ACTION") =>
    s.events.push({
      sequence: s.events.length + 1,
      round: s.round,
      at: now,
      category,
      message: { en, ja },
      command: cmd,
      changes: s.countries.flatMap((c) => {
        const before = state.countries.find((b) => b.name === c.name);
        return before && JSON.stringify(before) !== JSON.stringify(c)
          ? [{ country: c.name, before: { ...before }, after: { ...c } }]
          : [];
      }),
      draws: [...draws],
    });
  if (cmd.type === "SYNC") return s;
  if (
    ["START", "PAUSE", "RESUME", "CLOSE", "LOCK", "ADJUST", "ARCHIVE"].includes(
      cmd.type,
    )
  ) {
    requireRule(teacher, "Teacher access required / 教員権限が必要です");
    requireRule(
      cmd.round === undefined || cmd.round === s.round,
      "Stale round: refresh / ラウンドを更新してください",
    );
    requireRule(s.phase !== "ARCHIVED", "Game is archived");
    if (cmd.type === "LOCK") s.locked = !s.locked;
    if (cmd.type === "ARCHIVE") {
      requireRule(
        s.phase === "FINISHED" || s.phase === "LOBBY",
        "Finish the game before archiving",
      );
      s.phase = "ARCHIVED";
    }
    if (cmd.type === "CLOSE") {
      requireRule(
        s.phase === "RUNNING" || s.phase === "PAUSED",
        "No open round",
      );
      closeRound(s, now);
    }
    if (cmd.type === "PAUSE") {
      requireRule(s.phase === "RUNNING", "Round is not running");
      s.remaining = Math.max(0, (s.deadline! - now) / 1000);
      s.deadline = null;
      s.phase = "PAUSED";
    }
    if (cmd.type === "RESUME") {
      requireRule(s.phase === "PAUSED", "Round is not paused");
      s.phase = "RUNNING";
      s.deadline = now + s.remaining * 1000;
    }
    if (cmd.type === "ADJUST") {
      requireRule(
        !["FINISHED", "ARCHIVED"].includes(s.phase),
        "Results are immutable",
      );
      const c = s.countries.find((c) => c.name === cmd.target);
      requireRule(c, "Country not found");
      requireRule(cmd.reason?.trim(), "Adjustment requires a reason");
      requireRule(
        cmd.resource && [...RESOURCES, "vp"].includes(cmd.resource),
        "Invalid resource",
      );
      requireRule(
        Number.isInteger(cmd.delta) && Math.abs(cmd.delta!) <= 15,
        "Invalid adjustment",
      );
      if (cmd.resource === "vp") c.vp = Math.max(0, c.vp + cmd.delta!);
      else mod(c, cmd.resource as ResourceType, cmd.delta!);
    }
    if (cmd.type === "START") {
      requireRule(
        s.phase === "LOBBY" || s.phase === "BETWEEN_ROUNDS",
        "Cannot start round",
      );
      requireRule(s.countries.length >= 2, "At least two teams are required");
      s.round++;
      s.phase = "RUNNING";
      s.locked = true;
      s.remaining = s.duration;
      s.deadline = now + s.duration * 1000;
      s.countries.forEach((c) => (c.used = 0));
      const event = EVENT_DECK[roll(EVENT_DECK.length) - 1];
      s.event = event.code;
      for (const c of s.countries.filter((c) => !c.master)) {
        const ideology = INITIAL_COUNTRIES.find(
          (d) => d.name_en === c.name,
        )!.ideology;
        if (event.code === "CRASH") mod(c, "econ", -1);
        if (event.code === "TECH" && c.econ >= 4) mod(c, "econ", 1);
        if (event.code === "PANDEMIC") mod(c, "pol", -1);
        if (event.code === "PEACE") mod(c, "dip", 1);
        if (
          event.code === "WINTER" &&
          !ideology.includes("Liberal") &&
          !ideology.includes("Neutral")
        )
          mod(c, "mil", -1);
        if (event.code === "STRIKES" && ideology.includes("Liberal"))
          mod(c, "pol", -1);
        if (event.code === "COUP" && c.pol < 5) mod(c, "pol", -2);
        if (event.code === "SCANDAL") mod(c, "dip", -1);
        if (event.code === "ARMS" && c.mil > 5) mod(c, "mil", 1);
      }
      const active = s.countries.filter((c) => !c.master);
      if (event.code === "OIL" && active.length) {
        const lucky = active[roll(active.length) - 1];
        mod(lucky, "econ", 2);
        log(
          `Oil discovered: ${lucky.name}`,
          `油田発見: ${lucky.name}`,
          "EVENT",
        );
      }
      log(
        event.name_en + ": " + event.desc_en,
        event.name_ja + ": " + event.desc_ja,
        "EVENT",
      );
    }
    log(
      `Teacher: ${cmd.type}${cmd.reason ? " — " + cmd.reason : ""}`,
      `教員操作: ${cmd.type}${cmd.reason ? " — " + cmd.reason : ""}`,
      "GM",
    );
    return s;
  }
  requireRule(
    s.phase === "RUNNING",
    "Round is not accepting orders / 現在は行動できません",
  );
  requireRule(
    cmd.round === s.round,
    "Stale round: refresh / ラウンドを更新してください",
  );
  const c = s.countries.find((c) => c.name === actor);
  requireRule(c, "Team access required / チーム権限が必要です");
  const target = s.countries.find((c) => c.name === cmd.target);
  if (cmd.type === "PROPOSE") {
    independent(c);
    requireRule(target && target !== c, "Select another participating country");
    independent(target);
    requireRule(
      cmd.action === "TRADE" || cmd.action === "ALLIANCE",
      "Invalid treaty",
    );
    requireRule(
      !s.proposals.some(
        (p) =>
          p.status === "PENDING" &&
          p.kind === cmd.action &&
          [p.from, p.to].includes(c.name) &&
          [p.from, p.to].includes(target.name),
      ),
      "Proposal already pending",
    );
    requireRule(c.used < 2, "No orders remaining");
    s.proposals.push({
      id: `proposal-${s.events.length + 1}-${s.round}`,
      from: c.name,
      to: target.name,
      kind: cmd.action,
      round: s.round,
      status: "PENDING",
    });
  } else if (["ACCEPT", "DECLINE", "CANCEL"].includes(cmd.type)) {
    const p = s.proposals.find((p) => p.id === cmd.proposalId);
    requireRule(p && p.status === "PENDING", "Proposal is no longer pending");
    requireRule(
      cmd.type === "CANCEL" ? p.from === c.name : p.to === c.name,
      "This proposal is not yours",
    );
    if (cmd.type === "ACCEPT") {
      const from = s.countries.find((c) => c.name === p.from)!;
      independent(from);
      independent(c);
      order(from);
      order(c);
      if (p.kind === "TRADE") {
        requireRule(
          !s.proposals.some(
            (q) =>
              q.status === "ACCEPTED" &&
              q.round === s.round &&
              q.kind === "TRADE" &&
              [q.from, q.to].includes(c.name) &&
              [q.from, q.to].includes(from.name),
          ),
          "Already traded this round",
        );
        cost(from, "dip", 1);
        cost(c, "dip", 1);
        mod(from, "econ", 1);
        mod(c, "econ", 1);
      } else {
        requireRule(!allies(s, c.name).includes(from.name), "Already allied");
        requireRule(
          allies(s, c.name).length < 3 && allies(s, from.name).length < 3,
          "Maximum three allies",
        );
        const a = INITIAL_COUNTRIES.find(
            (d) => d.name_en === from.name,
          )!.ideology,
          b = INITIAL_COUNTRIES.find((d) => d.name_en === c.name)!.ideology;
        const n =
          a === b || a.includes("Neutral") || b.includes("Neutral") ? 1 : 2;
        cost(from, "dip", n);
        cost(c, "dip", n);
        mod(from, "pol", 1);
        mod(c, "pol", 1);
        s.alliances.push([from.name, c.name].sort() as [string, string]);
      }
      p.status = "ACCEPTED";
    } else p.status = cmd.type === "DECLINE" ? "DECLINED" : "CANCELLED";
  } else {
    requireRule(cmd.type === "ORDER", "Unknown command");
    order(c);
    if (c.master) {
      if (cmd.action === "REBUILD") {
        mod(c, "econ", 2);
        mod(c, "pol", 1);
      } else {
        requireRule(
          cmd.action === "RESIST",
          "Occupied teams may rebuild or resist",
        );
        cost(c, "pol", 2);
        if (roll(10) >= 6) free(c);
      }
    } else if (cmd.action?.startsWith("BUILD_")) {
      const index = [
        "BUILD_ECON",
        "BUILD_MIL",
        "BUILD_POL",
        "BUILD_DIP",
      ].indexOf(cmd.action);
      requireRule(index >= 0, "Invalid development");
      const res = RESOURCES[index];
      cost(c, RESOURCES[(index + 3) % 4], 2);
      mod(c, res, roll(10) >= (index < 2 ? 4 : 5) ? 2 : 1);
    } else if (cmd.action === "SPECIAL") {
      requireRule(!c.special, "Special power already used");
      c.special = true;
      const code = INITIAL_COUNTRIES.find(
        (d) => d.name_en === c.name,
      )!.special_code;
      if (["GER_REARM", "USSR_ARMY"].includes(code)) mod(c, "mil", 2);
      else if (["USA_AID", "IRN_OIL"].includes(code)) mod(c, "econ", 3);
      else if (["UK_BLOCKADE", "AUT_DIPLOMACY"].includes(code))
        mod(c, "dip", 2);
      else {
        mod(c, "econ", 1);
        mod(c, "pol", 1);
      }
    } else {
      requireRule(
        target && target !== c,
        "Select another participating country",
      );
      independent(target);
      if (cmd.action === "BREAK") {
        requireRule(allies(s, c.name).includes(target.name), "Not allied");
        cost(c, "pol", 2);
        s.alliances = s.alliances.filter(
          (p) => !(p.includes(c.name) && p.includes(target.name)),
        );
      } else if (cmd.action === "SPY") {
        cost(c, "dip", 2);
        if (roll(10) >= 7) mod(target, RESOURCES[roll(4) - 1], -1);
        else mod(c, "pol", -1);
      } else {
        requireRule(cmd.action === "WAR", "Invalid action");
        requireRule(
          !allies(s, c.name).includes(target.name),
          "Break your alliance before attacking",
        );
        cost(c, "mil", 2);
        cost(c, "pol", 1);
        const attack =
            c.mil + roll(6) + Math.min(4, 2 * allies(s, c.name).length),
          defense =
            target.mil +
            roll(6) +
            Math.min(4, 2 * allies(s, target.name).length);
        if (attack > defense) {
          const loot = Math.min(3, target.econ);
          mod(target, "econ", -3);
          mod(target, "mil", -3);
          mod(c, "econ", loot);
          c.vp += 3;
          if (!target.econ || !target.mil) {
            target.master = c.name;
            cancelTreaties(s, target.name);
            for (const puppet of s.countries.filter(
              (p) => p.master === target.name,
            )) {
              free(puppet);
              c.vp += 2;
              log(`Liberated ${puppet.name}`, `解放: ${puppet.name}`, "WAR");
            }
          }
        } else {
          mod(c, "mil", -2);
          target.vp += 2;
        }
        log(
          `Battle: ${c.name} ${attack} vs ${target.name} ${defense}`,
          `戦闘: ${c.name} ${attack} 対 ${target.name} ${defense}`,
          "WAR",
        );
      }
    }
  }
  const label = ORDERS.find((a) => a[0] === cmd.action);
  if (cmd.action !== "WAR")
    log(
      `${c.name}: ${label?.[1] ?? cmd.type}${target ? " → " + target.name : ""}`,
      `${c.name}: ${label?.[2] ?? cmd.type}${target ? " → " + target.name : ""}`,
      ["PROPOSE", "ACCEPT", "DECLINE", "CANCEL"].includes(cmd.type)
        ? "TREATY"
        : "ACTION",
    );
  return s;
}

export const ORDER_DETAILS_JA: Record<string, string> = {
  BUILD_ECON: "外交2を消費。70%で経済+2、それ以外は+1。",
  BUILD_MIL: "経済2を消費。70%で軍事+2、それ以外は+1。",
  BUILD_POL: "軍事2を消費。60%で政治+2、それ以外は+1。",
  BUILD_DIP: "政治2を消費。60%で外交+2、それ以外は+1。",
  TRADE:
    "双方の承認が必要。各国が1行動と外交1を消費し、経済+1。同じ相手とは1ラウンド1回。",
  ALLIANCE:
    "双方が1行動と外交1〜2を消費、政治+1。同陣営か中立を含む場合は外交1、それ以外は2。同盟は最大3国。",
  BREAK: "1行動と政治2で確実に同盟を解消。",
  SPY: "外交2を消費。40%で相手の資源をランダムに1減少。失敗は自国の政治-1。",
  WAR: "軍事2と政治1を消費。消費後の軍事+d6+同盟援軍（最大4）で戦闘。",
  SPECIAL: "ゲーム中1回のみ。1行動を消費。国家の特殊能力は国の概要で確認。",
  REBUILD: "占領中のみ。経済+2と政治+1。資源消費なし。",
  RESIST: "占領中のみ。政治2を消費。50%で独立。",
};

export const PHASE_NAMES: Record<string, Localized> = {
  LOBBY: { en: "Lobby", ja: "参加受付" },
  RUNNING: { en: "Round in progress", ja: "ラウンド進行中" },
  PAUSED: { en: "Paused", ja: "一時停止" },
  BETWEEN_ROUNDS: { en: "Debrief", ja: "振り返り" },
  FINISHED: { en: "Finished", ja: "終了" },
  ARCHIVED: { en: "Archived", ja: "アーカイブ" },
};
