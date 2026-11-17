import { INITIAL_COUNTRIES } from "./gameEngine";
import { allies, type Country, type State, type Event } from "./classroom";
import { BUILD_RULES, allianceCost, scoringBreakdown } from "./rules";
export type Lang = "dual" | "en" | "ja";
export type Copy = { en: string; ja: string };
export const copy = (en: string, ja: string): Copy => ({ en, ja });
export function text(lang: Lang, c: Copy) {
  return lang === "en" ? c.en : lang === "ja" ? c.ja : c.en + " / " + c.ja;
}
export const RESOURCE_INFO = {
  econ: {
    ...copy("Economy", "経済力"),
    icon: "◈",
    meaning: copy(
      "Your capacity to produce goods and support development.",
      "生産や国の発展を支える力です。",
    ),
  },
  mil: {
    ...copy("Military strength", "軍事力"),
    icon: "⚑",
    meaning: copy(
      "Your ability to attack, defend, and support national power.",
      "攻撃、防衛、国の力を支える能力です。",
    ),
  },
  pol: {
    ...copy("Political power", "政治力"),
    icon: "▣",
    meaning: copy(
      "Your government’s ability to lead and win support.",
      "政府が国をまとめ、支持を得る力です。",
    ),
  },
  dip: {
    ...copy("Diplomatic influence", "外交力"),
    icon: "◎",
    meaning: copy(
      "Your ability to build relationships and reach agreements.",
      "他国との関係を築き、合意する力です。",
    ),
  },
  vp: {
    ...copy("Victory points", "勝利点"),
    icon: "✦",
    meaning: copy(
      "Your score. The highest total wins at the end.",
      "ゲームの得点です。最後に最も多い国が勝ちます。",
    ),
  },
};
export type Resource = keyof typeof RESOURCE_INFO;
export type ActionId =
  | "BUILD_ECON"
  | "BUILD_MIL"
  | "BUILD_POL"
  | "BUILD_DIP"
  | "TRADE"
  | "ALLIANCE"
  | "BREAK"
  | "SPY"
  | "WAR"
  | "SPECIAL"
  | "REBUILD"
  | "RESIST";
export type ActionPresentation = {
  id: ActionId;
  title: Copy;
  purpose: Copy;
  result: Copy;
  art: string;
  group: number;
  target: boolean;
};
export const ACTIONS: ActionPresentation[] = [
  {
    id: "BUILD_ECON",
    title: copy("Grow your economy", "経済を発展させる"),
    purpose: copy(
      "Invest in production and infrastructure.",
      "生産や交通基盤に投資します。",
    ),
    result: copy("Gain 1 or 2 economy.", "経済力を1または2獲得。"),
    art: "industry",
    group: 0,
    target: false,
  },
  {
    id: "BUILD_MIL",
    title: copy("Strengthen your military", "軍備を強化する"),
    purpose: copy(
      "Improve your country’s ability to defend and fight.",
      "自国の防衛と戦闘の能力を高めます。",
    ),
    result: copy("Gain 1 or 2 military strength.", "軍事力を1または2獲得。"),
    art: "army",
    group: 0,
    target: false,
  },
  {
    id: "BUILD_POL",
    title: copy("Strengthen your government", "政府の力を高める"),
    purpose: copy(
      "Build support and improve national coordination.",
      "国内の支持を集め、国をまとめます。",
    ),
    result: copy("Gain 1 or 2 political power.", "政治力を1または2獲得。"),
    art: "public",
    group: 0,
    target: false,
  },
  {
    id: "BUILD_DIP",
    title: copy("Build foreign relations", "外交関係を築く"),
    purpose: copy(
      "Invest in relationships with other countries.",
      "他国との関係を深めるために投資します。",
    ),
    result: copy("Gain 1 or 2 diplomatic influence.", "外交力を1または2獲得。"),
    art: "diplomacy",
    group: 0,
    target: false,
  },
  {
    id: "TRADE",
    title: copy("Offer a trade agreement", "貿易を提案する"),
    purpose: copy(
      "Ask another country to cooperate on trade.",
      "他国に貿易協力を提案します。",
    ),
    result: copy(
      "If accepted, both countries gain 1 economy.",
      "承認されると双方の経済力が1増加。",
    ),
    art: "trade",
    group: 1,
    target: true,
  },
  {
    id: "ALLIANCE",
    title: copy("Propose an alliance", "同盟を提案する"),
    purpose: copy(
      "Ask another country to become your ally.",
      "他国に同盟国になるよう提案します。",
    ),
    result: copy(
      "If accepted, both gain 1 political power and support each other in battle.",
      "承認されると双方の政治力が1増加し、戦闘で援軍を得ます。",
    ),
    art: "diplomacy",
    group: 1,
    target: true,
  },
  {
    id: "BREAK",
    title: copy("Leave an alliance", "同盟を解消する"),
    purpose: copy(
      "End an existing alliance before changing direction.",
      "方針を変えるために既存の同盟を解消します。",
    ),
    result: copy("The alliance ends immediately.", "同盟はすぐに終了します。"),
    art: "diplomacy",
    group: 2,
    target: true,
  },
  {
    id: "SPY",
    title: copy("Send an intelligence mission", "諜報活動を行う"),
    purpose: copy(
      "Try to weaken another country’s resources.",
      "他国の資源を減らすことを試みます。",
    ),
    result: copy(
      "40% chance: the target loses 1 random resource. Otherwise you lose 1 political power.",
      "40%で相手の資源1種類が1減少。失敗すると自国の政治力が1減少。",
    ),
    art: "army",
    group: 2,
    target: true,
  },
  {
    id: "WAR",
    title: copy("Launch an attack", "攻撃を行う"),
    purpose: copy(
      "Challenge another country in battle.",
      "他国と戦闘を行います。",
    ),
    result: copy(
      "Victory earns 3 victory points and takes up to 3 economy. Defeat strengthens the defender’s score.",
      "勝利で勝利点3と経済力を最大3獲得。敗北すると相手が得点します。",
    ),
    art: "army",
    group: 2,
    target: true,
  },
  {
    id: "SPECIAL",
    title: copy("Use your national advantage", "国の特殊能力を使う"),
    purpose: copy(
      "Use your country’s special power once this game.",
      "このゲームで1回だけ、国の特殊能力を使えます。",
    ),
    result: copy(
      "Guaranteed effect. Read your country card for the benefit.",
      "確実に効果が発生。内容は国のカードで確認できます。",
    ),
    art: "public",
    group: 3,
    target: false,
  },
  {
    id: "REBUILD",
    title: copy("Rebuild your country", "国を復興する"),
    purpose: copy(
      "Restore strength while your country is occupied.",
      "占領中に国の力を回復します。",
    ),
    result: copy(
      "Gain 2 economy and 1 political power.",
      "経済力2と政治力1を獲得。",
    ),
    art: "transport",
    group: 0,
    target: false,
  },
  {
    id: "RESIST",
    title: copy("Work towards independence", "独立を目指す"),
    purpose: copy(
      "Organize resistance to occupation.",
      "占領からの独立に向けて抵抗を組織します。",
    ),
    result: copy(
      "50% chance of independence. Success restores economy and military strength to at least 3.",
      "50%で独立。成功すると経済力と軍事力が最低3になります。",
    ),
    art: "public",
    group: 2,
    target: false,
  },
];
const THEMES: Record<string, { title: Copy; art: string }[]> = {
  BUILD_ECON: [
    { title: copy("Expand the factories", "工場を拡張する"), art: "industry" },
    {
      title: copy("Connect the railway network", "鉄道網をつなぐ"),
      art: "transport",
    },
    {
      title: copy("Modernize agricultural trade", "農産物の流通を整える"),
      art: "trade",
    },
  ],
  BUILD_MIL: [
    { title: copy("Modernize the navy", "海軍を近代化する"), art: "navy" },
    { title: copy("Train air crews", "航空隊を訓練する"), art: "aviation" },
    {
      title: copy("Improve army equipment", "陸軍の装備を改善する"),
      art: "army",
    },
  ],
  BUILD_POL: [
    {
      title: copy("Organize a public campaign", "国民への説明会を開く"),
      art: "public",
    },
    {
      title: copy("Coordinate the government", "政府の連携を改善する"),
      art: "diplomacy",
    },
  ],
  BUILD_DIP: [
    {
      title: copy("Send a diplomatic mission", "外交使節を派遣する"),
      art: "diplomacy",
    },
    { title: copy("Host international talks", "国際会議を開く"), art: "trade" },
  ],
};
export function themeFor(id: string, country: string, round: number) {
  let list = THEMES[id];
  if (!list) return null;
  if (["Austria", "Czech"].includes(country))
    list = list.filter((t) => t.art !== "navy");
  const index = Math.max(
    0,
    INITIAL_COUNTRIES.findIndex((c) => c.name_en === country),
  );
  return list[(Math.max(1, round) - 1 + index) % list.length];
}
export function countryName(name: string, lang: Lang) {
  const d = INITIAL_COUNTRIES.find((c) => c.name_en === name);
  const aliases: Record<string, Copy> = {
    UK: copy("United Kingdom", "イギリス"),
    USA: copy("United States", "アメリカ"),
    USSR: copy("Soviet Union", "ソ連"),
    Czech: copy("Czechoslovakia", "チェコスロバキア"),
  };
  return d ? text(lang, aliases[name] ?? copy(d.name_en, d.name_ja)) : name;
}
export function goals(c: Country): {
  primary: Copy;
  secondary: Copy;
  suggestion: Copy;
  resource: Resource;
  target: number;
  practice: ActionId;
} {
  const ideology = INITIAL_COUNTRIES.find(
    (d) => d.name_en === c.name,
  )!.ideology;
  if (ideology.includes("Fascist"))
    return {
      primary: copy(
        "Reach 9 military strength for 1 extra victory point each round, or 10 for 2 extra.",
        "軍事力9で毎ラウンド勝利点1を追加。10以上なら2を追加。",
      ),
      secondary: copy(
        "Have 3 allies for 1 more victory point each round.",
        "同盟国が3か国あると毎ラウンド勝利点1を追加。",
      ),
      suggestion: copy(
        "Consider strengthening your military to work towards your scoring goal.",
        "得点目標に向けて軍備の強化を検討しましょう。",
      ),
      resource: "mil",
      target: 10,
      practice: "BUILD_MIL",
    };
  if (ideology.includes("Liberal"))
    return {
      primary: copy(
        "Reach 9 economy for 1 extra victory point each round, or 10 for 2 extra.",
        "経済力9で毎ラウンド勝利点1を追加。10以上なら2を追加。",
      ),
      secondary: copy(
        "Have 3 allies for 1 more victory point each round.",
        "同盟国が3か国あると毎ラウンド勝利点1を追加。",
      ),
      suggestion: copy(
        "Consider growing your economy or negotiating trade.",
        "経済の発展や貿易交渉を検討しましょう。",
      ),
      resource: "econ",
      target: 10,
      practice: "BUILD_ECON",
    };
  if (ideology.includes("Communist"))
    return {
      primary: copy(
        "Reach 8 political power for 1 extra victory point each round, or 9 for 2 extra.",
        "政治力8で毎ラウンド勝利点1を追加。9以上なら2を追加。",
      ),
      secondary: copy(
        "Keep military strength at 8 or more for 1 extra victory point.",
        "軍事力8以上で毎ラウンド勝利点1を追加。",
      ),
      suggestion: copy(
        "Consider building political power while keeping a strong military.",
        "軍事力を保ちながら政治力を高めることを検討しましょう。",
      ),
      resource: "pol",
      target: 9,
      practice: "BUILD_POL",
    };
  return {
    primary: copy(
      "Reach 8 economy AND 5 military strength for 2 extra victory points. Otherwise, 7 economy OR 4 military strength earns 1 extra.",
      "経済力8かつ軍事力5で勝利点2を追加。それ以外でも経済力7または軍事力4なら1を追加。",
    ),
    secondary: copy(
      "Reach 7 diplomatic influence for 1 more victory point each round.",
      "外交力7以上で毎ラウンド勝利点1を追加。",
    ),
    suggestion: copy(
      "Consider economic development, then balance military strength and foreign relations.",
      "経済を発展させ、軍事力と外交関係のバランスを考えましょう。",
    ),
    resource: "econ",
    target: 8,
    practice: "BUILD_ECON",
  };
}
export function costs(
  id: string,
  c: Country,
  target?: Country,
): Partial<Record<Resource, number>> {
  if (BUILD_RULES[id])
    return { [BUILD_RULES[id].cost]: BUILD_RULES[id].amount };
  if (id === "TRADE") return { dip: 1 };
  if (id === "ALLIANCE")
    return { dip: target ? allianceCost(c.name, target.name) : 1 };
  if (id === "BREAK" || id === "RESIST") return { pol: 2 };
  if (id === "SPY") return { dip: 2 };
  if (id === "WAR") return { mil: 2, pol: 1 };
  return {};
}
export function costText(id: string, c: Country, lang: Lang, target?: Country) {
  const entries = Object.entries(costs(id, c, target));
  let en = entries
      .map(([r, n]) => `${n} ${RESOURCE_INFO[r as Resource].en.toLowerCase()}`)
      .join(" and "),
    ja = entries
      .map(([r, n]) => `${RESOURCE_INFO[r as Resource].ja}${n}`)
      .join("と");
  if (id === "ALLIANCE" && !target) {
    en = "1 or 2 diplomatic influence";
    ja = "外交力1または2";
  }
  if (["TRADE", "ALLIANCE"].includes(id))
    return text(
      lang,
      copy(
        `Free to propose. If accepted, each side spends 1 action and ${en}.`,
        `送信は無料。承認時に双方が1行動と${ja}を消費。`,
      ),
    );
  return text(
    lang,
    entries.length
      ? copy(`Spend 1 team action and ${en}.`, `チームの1行動と${ja}を消費。`)
      : copy(
          "Spend 1 team action. No resources required.",
          "チームの1行動を使用。資源の消費はありません。",
        ),
  );
}
export function unavailable(
  s: State,
  c: Country,
  id: string,
  lang: Lang,
  target?: Country,
) {
  if (["FINISHED", "ARCHIVED"].includes(s.phase))
    return text(
      lang,
      copy(
        "This game has finished. Review the final victory points.",
        "このゲームは終了しました。最終的な勝利点を確認しましょう。",
      ),
    );
  if (s.phase !== "RUNNING")
    return text(
      lang,
      copy(
        "Wait for the teacher to start or resume the round.",
        "教員によるラウンドの開始・再開を待ってください。",
      ),
    );
  if (c.used >= 2)
    return text(
      lang,
      copy(
        "Your team has used both actions this round.",
        "チームはこのラウンドの2行動を使用しました。",
      ),
    );
  if (c.master && !["REBUILD", "RESIST"].includes(id))
    return text(
      lang,
      copy(
        "Your country is occupied. Choose Rebuild or Work towards independence.",
        "占領中です。復興または独立に向けた行動を選んでください。",
      ),
    );
  if (!c.master && ["REBUILD", "RESIST"].includes(id))
    return text(
      lang,
      copy(
        "This action is only for an occupied country.",
        "この行動は占領中の国だけが使えます。",
      ),
    );
  if (target?.master)
    return text(
      lang,
      copy(
        "This country is occupied. Choose an independent country.",
        "この国は占領中です。独立国を選んでください。",
      ),
    );
  if (target && id === "ALLIANCE" && allies(s, c.name).includes(target.name))
    return text(lang, copy("You are already allies.", "すでに同盟国です。"));
  if (
    target &&
    id === "TRADE" &&
    s.proposals.some(
      (p) =>
        p.kind === "TRADE" &&
        p.status === "ACCEPTED" &&
        p.round === s.round &&
        [p.from, p.to].includes(c.name) &&
        [p.from, p.to].includes(target.name),
    )
  )
    return text(
      lang,
      copy(
        "These countries have already traded this round.",
        "この2か国はこのラウンドですでに貿易しています。",
      ),
    );
  if (id === "SPECIAL" && c.special)
    return text(
      lang,
      copy(
        "Your national advantage has already been used.",
        "国の特殊能力は使用済みです。",
      ),
    );
  for (const [r, n] of Object.entries(costs(id, c, target)))
    if (c[r as Resource] < n!)
      return text(
        lang,
        copy(
          `You need ${n} ${RESOURCE_INFO[r as Resource].en}; you currently have ${c[r as Resource]}.`,
          `${RESOURCE_INFO[r as Resource].ja}が${n}必要です。現在は${c[r as Resource]}です。`,
        ),
      );
  if (target && id === "WAR" && allies(s, c.name).includes(target.name))
    return text(
      lang,
      copy(
        "Leave this alliance before attacking.",
        "攻撃する前に同盟を解消してください。",
      ),
    );
  if (id === "BREAK" && !allies(s, c.name).length)
    return text(
      lang,
      copy(
        "Your country has no alliances to leave.",
        "解消する同盟がありません。",
      ),
    );
  if (target && id === "BREAK" && !allies(s, c.name).includes(target.name))
    return text(
      lang,
      copy(
        "You do not have an alliance with this country.",
        "この国とは同盟していません。",
      ),
    );
  if (
    target &&
    id === "ALLIANCE" &&
    (allies(s, c.name).length >= 3 || allies(s, target.name).length >= 3)
  )
    return text(
      lang,
      copy("A country can have at most 3 allies.", "同盟国は最大3か国です。"),
    );
  return "";
}
export function eventTitle(e: Event, lang: Lang) {
  if (e.message.en.startsWith("Liberated ")) return text(lang, e.message);
  const actor = e.message.en.startsWith("Battle: ")
    ? e.message.en.slice(8).split(" ")[0]
    : e.message.en.split(":")[0];
  if (e.command?.type === "ORDER" || e.command?.type === "PROPOSE") {
    const action = ACTIONS.find((a) => a.id === e.command?.action);
    if (action)
      return countryName(actor, lang) + " — " + text(lang, action.title);
  }
  const responses: Record<string, Copy> = {
    ACCEPT: copy("Accepted an agreement", "合意を承認しました"),
    DECLINE: copy("Declined a proposal", "提案を拒否しました"),
    CANCEL: copy("Cancelled a proposal", "提案を取り消しました"),
  };
  if (e.command && responses[e.command.type])
    return (
      countryName(actor, lang) + " — " + text(lang, responses[e.command.type])
    );
  if (e.category === "GM")
    return (
      text(lang, copy("Teacher announcement", "教員からの連絡")) +
      (e.command?.reason ? " — " + e.command.reason : "")
    );
  return text(lang, e.message)
    .replace(/\bVP\b/g, text(lang, RESOURCE_INFO.vp))
    .replace(/\bEcon\b/g, text(lang, RESOURCE_INFO.econ))
    .replace(/\bMil\b/g, text(lang, RESOURCE_INFO.mil))
    .replace(/\bPol\b/g, text(lang, RESOURCE_INFO.pol))
    .replace(/\bDip\b/g, text(lang, RESOURCE_INFO.dip));
}
export { scoringBreakdown };

export function friendlyError(error: unknown, lang: Lang) {
  const e = error as {
    code?: string;
    params?: Record<string, string | number>;
  };
  if (e.code === "INSUFFICIENT_RESOURCE") {
    const p = e.params ?? {},
      r = RESOURCE_INFO[p.resource as Resource];
    return text(
      lang,
      copy(
        `You need ${p.required} ${r?.en ?? "resources"}; you currently have ${p.current}.`,
        `${r?.ja ?? "資源"}が${p.required}必要です。現在は${p.current}です。`,
      ),
    );
  }
  const messages: Record<string, Copy> = {
    NO_ACTIONS: copy(
      "Your team has used both actions this round.",
      "チームはこのラウンドの2行動を使用しました。",
    ),
    STALE_ROUND: copy(
      "The round has changed. Review your decision again.",
      "ラウンドが変わりました。行動をもう一度確認してください。",
    ),
    ROUND_CLOSED: copy(
      "This round is not accepting actions. Wait for your teacher.",
      "現在は行動を受け付けていません。教員の進行を待ってください。",
    ),
    SPECIAL_USED: copy(
      "Your national advantage has already been used.",
      "国の特殊能力は使用済みです。",
    ),
    ACTION_UNAVAILABLE: copy(
      "This decision is no longer available. Check the countries, resources, and remaining team actions.",
      "この行動は現在選べません。対象国、資源、残り行動を確認してください。",
    ),
  };
  return text(
    lang,
    messages[e.code ?? ""] ??
      copy(
        "We could not complete this request. Check your connection, or return to the home page to rejoin your team.",
        "操作を完了できませんでした。接続を確認するか、ホーム画面からチームに再参加してください。",
      ),
  );
}

export function readable(copy: Copy): Copy {
  return {
    en: copy.en
      .replace(/\bMil\b/g, "military strength")
      .replace(/\bEcon\b/g, "economy")
      .replace(/\bPol\b/g, "political power")
      .replace(/\bDip\b/g, "diplomatic influence")
      .replace(/\bVP\b/g, "victory points")
      .replace(/\bMilitary(?! strength)\b/g, "Military strength")
      .replace(/\bPolitics\b/g, "Political power")
      .replace(/\bDiplomacy\b/g, "Diplomatic influence"),
    ja: copy.ja
      .replace(/軍事(?!力)/g, "軍事力")
      .replace(/経済(?!力)/g, "経済力")
      .replace(/政治(?!力)/g, "政治力")
      .replace(/外交(?!力)/g, "外交力"),
  };
}
