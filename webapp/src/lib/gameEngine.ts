export enum Ideology {
  FASCIST = "Fascist/ファシスト",
  LIBERAL = "Liberal/自由主義",
  COMMUNIST = "Communist/共産主義",
  NEUTRAL = "Neutral/中立",
}

export type ResourceType = "econ" | "mil" | "pol" | "dip";

export interface CountryDefinition {
  name_en: string;
  name_ja: string;
  flag: string;
  ideology: Ideology;
  econ: number;
  mil: number;
  pol: number;
  dip: number;
  special_code: string;
  special_title_en: string;
  special_title_ja: string;
  special_desc_en: string;
  special_desc_ja: string;
  history_en: string;
  history_ja: string;
}

export const INITIAL_COUNTRIES: CountryDefinition[] = [
  {
    name_en: "Germany",
    name_ja: "ドイツ",
    flag: "🇩🇪",
    ideology: Ideology.FASCIST,
    econ: 6,
    mil: 8,
    pol: 6,
    dip: 4,
    special_code: "GER_REARM",
    special_title_en: "Massive Rearmament",
    special_title_ja: "再軍備宣言",
    special_desc_en: "Grants +2 Military instantly.",
    special_desc_ja: "軍事力を即座に+2増加。",
    history_en: "Aggressive expansionist aiming for European hegemony.",
    history_ja: "欧州制覇を目論むファシズムの軍事強国。",
  },
  {
    name_en: "Japan",
    name_ja: "日本",
    flag: "🇯🇵",
    ideology: Ideology.FASCIST,
    econ: 5,
    mil: 7,
    pol: 5,
    dip: 4,
    special_code: "JPN_EXPAND",
    special_title_en: "Imperial Sphere",
    special_title_ja: "大東亜共栄圏動員",
    special_desc_en: "Grants +1 Economy and +1 Politics.",
    special_desc_ja: "経済+1、政治+1を即座に獲得。",
    history_en: "Dominant Asian empire with powerful naval and army forces.",
    history_ja: "アジアの覇権と資源確保を目指す軍事帝国。",
  },
  {
    name_en: "Italy",
    name_ja: "イタリア",
    flag: "🇮🇹",
    ideology: Ideology.FASCIST,
    econ: 5,
    mil: 6,
    pol: 5,
    dip: 5,
    special_code: "ITA_RALLY",
    special_title_en: "Fascist Rally",
    special_title_ja: "ファシスト国民総決起",
    special_desc_en: "Grants +1 Economy and +1 Politics.",
    special_desc_ja: "経済+1、政治+1を即座に獲得。",
    history_en: "Mediterranean power aspiring to revive Roman glory.",
    history_ja: "地中海の覇権とローマ帝国の再興を掲げる。",
  },
  {
    name_en: "Spain",
    name_ja: "スペイン",
    flag: "🇪🇸",
    ideology: Ideology.FASCIST,
    econ: 4,
    mil: 4,
    pol: 3,
    dip: 3,
    special_code: "ESP_REBUILD",
    special_title_en: "National Reconstruction",
    special_title_ja: "内戦後復興計画",
    special_desc_en: "Grants +1 Economy and +1 Politics.",
    special_desc_ja: "経済+1、政治+1を即座に獲得。",
    history_en: "Recovering from Civil War, nationalist regime.",
    history_ja: "内戦の傷痕から立ち上がりつつある独裁国家。",
  },
  {
    name_en: "UK",
    name_ja: "イギリス",
    flag: "🇬🇧",
    ideology: Ideology.LIBERAL,
    econ: 8,
    mil: 6,
    pol: 7,
    dip: 7,
    special_code: "UK_BLOCKADE",
    special_title_en: "Naval Supremacy",
    special_title_ja: "ロイヤルネイビー海上封鎖",
    special_desc_en: "Grants +2 Diplomacy instantly.",
    special_desc_ja: "外交力を即座に+2増加。",
    history_en: "Global empire with massive financial and naval leverage.",
    history_ja: "広大な植民地と強大な海軍・経済力を誇る大英帝国。",
  },
  {
    name_en: "France",
    name_ja: "フランス",
    flag: "🇫🇷",
    ideology: Ideology.LIBERAL,
    econ: 6,
    mil: 5,
    pol: 5,
    dip: 6,
    special_code: "FRA_MAGINOT",
    special_title_en: "Maginot Fortification",
    special_title_ja: "マジノ線要塞防衛",
    special_desc_en: "Grants +1 Economy and +1 Politics.",
    special_desc_ja: "経済+1、政治+1を即座に獲得。",
    history_en: "Democracy guarding Western Europe behind fortified lines.",
    history_ja: "欧州の平和を守る民主主義国、強固な防衛線を構築。",
  },
  {
    name_en: "USA",
    name_ja: "アメリカ",
    flag: "🇺🇸",
    ideology: Ideology.LIBERAL,
    econ: 9,
    mil: 4,
    pol: 6,
    dip: 5,
    special_code: "USA_AID",
    special_title_en: "Lend-Lease Boom",
    special_title_ja: "巨大産業動員 (武器貸与)",
    special_desc_en: "Grants +3 Economy instantly.",
    special_desc_ja: "経済力を即座に+3増加。",
    history_en:
      "Economic colossus following isolationist policy until provoked.",
    history_ja: "世界最大の工業力と資源を持つ巨大民主主義国家。",
  },
  {
    name_en: "China",
    name_ja: "中国",
    flag: "🇨🇳",
    ideology: Ideology.LIBERAL,
    econ: 4,
    mil: 5,
    pol: 5,
    dip: 4,
    special_code: "CHN_GUERRILLA",
    special_title_en: "Guerrilla Mobilization",
    special_title_ja: "抗日全民族統一戦線",
    special_desc_en: "Grants +1 Economy and +1 Politics.",
    special_desc_ja: "経済+1、政治+1を即座に獲得。",
    history_en: "Resilient nation enduring foreign aggression.",
    history_ja: "広大な領土と不屈の民衆で侵略に抗う大国。",
  },
  {
    name_en: "Poland",
    name_ja: "ポーランド",
    flag: "🇵🇱",
    ideology: Ideology.LIBERAL,
    econ: 5,
    mil: 5,
    pol: 5,
    dip: 4,
    special_code: "POL_MOBILIZE",
    special_title_en: "General Mobilization",
    special_title_ja: "国民総動員令",
    special_desc_en: "Grants +1 Economy and +1 Politics.",
    special_desc_ja: "経済+1、政治+1を即座に獲得。",
    history_en: "Caught between giants, determined to defend independence.",
    history_ja: "東西の軍事大国に挟まれた誇り高き中欧国家。",
  },
  {
    name_en: "Czech",
    name_ja: "チェコ",
    flag: "🇨🇿",
    ideology: Ideology.LIBERAL,
    econ: 5,
    mil: 5,
    pol: 5,
    dip: 4,
    special_code: "CZE_FORTIFY",
    special_title_en: "Sudeten Fortresses",
    special_title_ja: "ズデーテン要塞線",
    special_desc_en: "Grants +1 Economy and +1 Politics.",
    special_desc_ja: "経済+1、政治+1を即座に獲得。",
    history_en: "Advanced industrial democracy with formidable border forts.",
    history_ja: "高度な工業力と堅固な要塞を持つ中欧の民主主義国。",
  },
  {
    name_en: "USSR",
    name_ja: "ソ連",
    flag: "🇷🇺",
    ideology: Ideology.COMMUNIST,
    econ: 6,
    mil: 8,
    pol: 7,
    dip: 3,
    special_code: "USSR_ARMY",
    special_title_en: "Red Army Mass Mobilization",
    special_title_ja: "労農赤軍大増強",
    special_desc_en: "Grants +2 Military instantly.",
    special_desc_ja: "軍事力を即座に+2増加。",
    history_en: "Colossal communist union with vast industrial war machine.",
    history_ja: "共産主義の総本山、強大な赤軍と重工業を誇る。",
  },
  {
    name_en: "Turkey",
    name_ja: "トルコ",
    flag: "🇹🇷",
    ideology: Ideology.NEUTRAL,
    econ: 5,
    mil: 4,
    pol: 5,
    dip: 5,
    special_code: "TUR_BOSPHORUS",
    special_title_en: "Strait Control",
    special_title_ja: "海峡防備条約強化",
    special_desc_en: "Grants +1 Economy and +1 Politics.",
    special_desc_ja: "経済+1、政治+1を即座に獲得。",
    history_en: "Guardian of the strategic Bosphorus straits.",
    history_ja: "東西の十字路に位置し、中立を守る要衝国家。",
  },
  {
    name_en: "Austria",
    name_ja: "オーストリア",
    flag: "🇦🇹",
    ideology: Ideology.NEUTRAL,
    econ: 4,
    mil: 3,
    pol: 3,
    dip: 4,
    special_code: "AUT_DIPLOMACY",
    special_title_en: "Habsburg Diplomacy",
    special_title_ja: "欧州協調伝統外交",
    special_desc_en: "Grants +2 Diplomacy instantly.",
    special_desc_ja: "外交力を即座に+2増加。",
    history_en: "Cultured central European nation facing annexation pressure.",
    history_ja: "ハプスブルクの伝統を継ぐが、合邦の危機に直面。",
  },
  {
    name_en: "Iran",
    name_ja: "イラン",
    flag: "🇮🇷",
    ideology: Ideology.NEUTRAL,
    econ: 4,
    mil: 3,
    pol: 4,
    dip: 4,
    special_code: "IRN_OIL",
    special_title_en: "Persian Oil Boom",
    special_title_ja: "油田国有・開発ブーム",
    special_desc_en: "Grants +3 Economy instantly.",
    special_desc_ja: "経済力を即座に+3増加。",
    history_en: "Strategic Middle Eastern state with vital petroleum reserves.",
    history_ja: "豊富な石油資源を持ち、列強の思惑が交差する。",
  },
];

export const RESOURCE_CAP = 15;

export type ActionCode =
  | "BUILD_ECON"
  | "BUILD_MIL"
  | "BUILD_POL"
  | "BUILD_DIP"
  | "ACT_TRADE"
  | "ACT_ALLIANCE"
  | "ACT_BREAK"
  | "ACT_SPY"
  | "ACT_WAR"
  | "ACT_SPECIAL";

export interface ActionDefinition {
  code: ActionCode;
  name_en: string;
  name_ja: string;
  cost_res: ResourceType | "none";
  cost_amt: number | "VARIES";
  target_required: boolean;
  desc_en: string;
  desc_ja: string;
  odds_en: string;
  odds_ja: string;
}

export const ACTION_DEFS: ActionDefinition[] = [
  {
    code: "BUILD_ECON",
    name_en: "Industry",
    name_ja: "産業育成 (経済開発)",
    cost_res: "dip",
    cost_amt: 2,
    target_required: false,
    desc_en: "Invest in industrial output and infrastructure.",
    desc_ja: "外交力2を消費して国内産業を育成。",
    odds_en: "70% (+2 Econ), 30% (+1 Econ)",
    odds_ja: "70%で+2経済、30%で+1経済",
  },
  {
    code: "BUILD_MIL",
    name_en: "Rearmament",
    name_ja: "軍備拡張 (軍事強化)",
    cost_res: "econ",
    cost_amt: 2,
    target_required: false,
    desc_en:
      "Spend industrial power to manufacture weapons and enlist divisions.",
    desc_ja: "経済力2を消費して兵器を生産し軍隊を増強。",
    odds_en: "70% (+2 Mil), 30% (+1 Mil)",
    odds_ja: "70%で+2軍事、30%で+1軍事",
  },
  {
    code: "BUILD_POL",
    name_en: "Rally / Propaganda",
    name_ja: "政治宣伝 (国民結集)",
    cost_res: "mil",
    cost_amt: 2,
    target_required: false,
    desc_en:
      "Use military prestige to consolidate internal political authority.",
    desc_ja: "軍事力2を消費して求心力を高め政治力を強化。",
    odds_en: "60% (+2 Pol), 40% (+1 Pol)",
    odds_ja: "60%で+2政治、40%で+1政治",
  },
  {
    code: "BUILD_DIP",
    name_en: "Diplomatic Corps",
    name_ja: "外交工作 (外交力向上)",
    cost_res: "pol",
    cost_amt: 2,
    target_required: false,
    desc_en: "Deploy diplomats and foreign missions across embassies.",
    desc_ja: "政治力2を消費して国際社会への影響力を拡大。",
    odds_en: "60% (+2 Dip), 40% (+1 Dip)",
    odds_ja: "60%で+2外交、40%で+1外交",
  },
  {
    code: "ACT_TRADE",
    name_en: "Trade Agreement",
    name_ja: "通商協定 (貿易締結)",
    cost_res: "dip",
    cost_amt: 1,
    target_required: true,
    desc_en: "Negotiate bilateral commerce treaties.",
    desc_ja: "対象国と貿易協定を交渉。同盟や同陣営だと双方に利益。",
    odds_en: "65% Success (Same Ideology: +1 both; Different: +1 you)",
    odds_ja: "65%成功 (同陣営: 双方+1経済、異陣営: 自国のみ+1経済)",
  },
  {
    code: "ACT_ALLIANCE",
    name_en: "Propose Alliance",
    name_ja: "同盟提案 (軍事同盟締結)",
    cost_res: "dip",
    cost_amt: "VARIES",
    target_required: true,
    desc_en: "Forge a mutual defense pact. Allies assist you in battles!",
    desc_ja: "相互防衛同盟を締結。戦争時に同盟国が援軍ボーナス(+2)！",
    odds_en: "Same Ideology (DC 5), Neutral (DC 6), Opposing (DC 8)",
    odds_ja: "同陣営(成功率60%)、中立(50%)、異陣営(30%)。拒否時相手-1政治",
  },
  {
    code: "ACT_BREAK",
    name_en: "Break Treaty",
    name_ja: "同盟破棄 (裏切り)",
    cost_res: "pol",
    cost_amt: 2,
    target_required: true,
    desc_en: "Unilaterally terminate existing alliance ties.",
    desc_ja: "既存の同盟関係を一方的に破棄・清算。",
    odds_en: "65% Clean break, 25% Scandal (-1 Pol), 10% Target strengthens",
    odds_ja: "65%円満破棄、25%スキャンダル(-1政治)、10%相手強化",
  },
  {
    code: "ACT_SPY",
    name_en: "Sabotage / Espionage",
    name_ja: "スパイ工作 (破壊工作)",
    cost_res: "dip",
    cost_amt: 2,
    target_required: true,
    desc_en:
      "Infiltrate target's factories or headquarters to diminish their assets.",
    desc_ja: "対象国にスパイを送り、資源を秘密裏に1点奪取/破壊。",
    odds_en: "40% Target loses 1 random resource. Fail: you lose 1 Pol",
    odds_ja: "40%で対象国の資源をランダム-1。失敗時自国-1政治",
  },
  {
    code: "ACT_WAR",
    name_en: "Declare War / Attack",
    name_ja: "宣戦布告 / 軍事侵攻",
    cost_res: "mil",
    cost_amt: 2,
    target_required: true,
    desc_en:
      "Launch full invasion! Attacker = Mil + d6 + 2*Allies vs Defender.",
    desc_ja: "軍事侵攻！勝者は資源略奪(+3VP)。相手が壊滅すると属国(傀儡)化！",
    odds_en:
      "Victory: Loot up to 3 Econ, +3 VP. Conquer if Mil/Econ drops to 0!",
    odds_ja: "勝利時: 3経済略奪・+3VP。相手が力尽きると完全征服(傀儡化)",
  },
  {
    code: "ACT_SPECIAL",
    name_en: "Activate Special Power",
    name_ja: "国家固有特殊能力 発動",
    cost_res: "none",
    cost_amt: 0,
    target_required: false,
    desc_en: "Unleash your unique historical advantage (Usable once per game).",
    desc_ja: "自国の歴史的アドバンテージを解放 (1ゲーム中1回のみ使用可能)。",
    odds_en: "100% Guaranteed historical power activation!",
    odds_ja: "100% 確実に固有能力を発動！",
  },
];

export interface RandomEventDef {
  code: string;
  name_en: string;
  name_ja: string;
  desc_en: string;
  desc_ja: string;
}

export const EVENT_DECK: RandomEventDef[] = [
  {
    code: "CRASH",
    name_en: "Stock Market Crash",
    name_ja: "世界恐慌・市場暴落",
    desc_en: "Global economic crisis: ALL active countries lose 1 Economy.",
    desc_ja: "世界経済危機: 全国の経済が-1。",
  },
  {
    code: "TECH",
    name_en: "Industrial Innovation",
    name_ja: "産業技術革新",
    desc_en: "Nations with Economy ≥ 4 gain +1 Economy.",
    desc_ja: "経済力が4以上の国は経済が+1。",
  },
  {
    code: "PANDEMIC",
    name_en: "Global Flu Outbreak",
    name_ja: "世界的感染症の流行",
    desc_en: "Civil unrest and health crisis: ALL countries lose 1 Politics.",
    desc_ja: "社会混乱: 全国の政治が-1。",
  },
  {
    code: "PEACE",
    name_en: "International Peace Treaty",
    name_ja: "国際平和軍縮機運",
    desc_en: "Diplomatic goodwill: ALL active countries gain +1 Diplomacy.",
    desc_ja: "平和協調: 全国の外交が+1。",
  },
  {
    code: "WINTER",
    name_en: "Harsh Siberian Winter",
    name_ja: "歴史的厳冬の到来",
    desc_en: "Freezing fronts: Fascist and Communist nations lose 1 Military.",
    desc_ja: "極寒の冬: ファシストおよび共産主義国の軍事が-1。",
  },
  {
    code: "STRIKES",
    name_en: "General Labor Strikes",
    name_ja: "ゼネスト・労働争議",
    desc_en: "Social discontent: Liberal Democracies lose 1 Politics.",
    desc_ja: "自由主義民主主義国の政治が-1。",
  },
  {
    code: "COUP",
    name_en: "Coup D'etat Waves",
    name_ja: "クーデターの激化",
    desc_en:
      "Unstable states with Politics < 5 suffer political purges (-2 Politics).",
    desc_ja: "政治力が5未満の政情不安定国は政治が-2。",
  },
  {
    code: "OIL",
    name_en: "Great Petroleum Discovery",
    name_ja: "大油田の発見",
    desc_en: "A random active nation discovers rich oil fields (+2 Economy).",
    desc_ja: "ランダムな1国で大油田が発見され経済+2。",
  },
  {
    code: "SCANDAL",
    name_en: "Espionage Wiretap Scandal",
    name_ja: "国際盗聴スキャンダル",
    desc_en: "Diplomatic fallout: ALL active countries lose 1 Diplomacy.",
    desc_ja: "外交不信: 全国の外交が-1。",
  },
  {
    code: "ARMS",
    name_en: "Great Arms Race",
    name_ja: "軍拡競争の激化",
    desc_en: "Heavily militarized states (Military > 5) gain +1 Military.",
    desc_ja: "軍事力が5より高い軍事大国は軍事がさらに+1。",
  },
];

export function rollDice(sides: number = 10): number {
  return Math.floor(Math.random() * sides) + 1;
}
