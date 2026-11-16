export type LangMode = "dual" | "en" | "ja";

export interface LocalizedString {
  en: string;
  ja: string;
}

export function t(loc: LocalizedString, mode: LangMode = "dual"): string {
  if (mode === "en") return loc.en;
  if (mode === "ja") return loc.ja;
  return `${loc.en} / ${loc.ja}`;
}

export const I18N = {
  // Navigation & General
  title: { en: "1937 SIMULATOR", ja: "1937 歴史シミュレーション" },
  subtitle: {
    en: "Special Powers Edition (v15)",
    ja: "国家特殊能力エディション (v15)",
  },
  dualLang: { en: "Dual (EN/JA)", ja: "日英両方" },
  enOnly: { en: "English", ja: "英語のみ" },
  jaOnly: { en: "日本語", ja: "日本語のみ" },

  // Lobby / Join
  joinTab: { en: "Join Game", ja: "ゲームに参加" },
  hostTab: { en: "Host / GM Room", ja: "GMルーム作成" },
  roomCode: { en: "Room Code", ja: "ルームコード" },
  roomCodePlaceholder: { en: "e.g. HIST101", ja: "例: HIST101" },
  playerName: { en: "Player / Team Name", ja: "プレイヤー名 / 班の名前" },
  playerNamePlaceholder: { en: "e.g. Student 1 & 2", ja: "例: 班名 / 学生名" },
  selectNation: { en: "Select Your Nation", ja: "担当国を選択" },
  chooseNationPlaceholder: {
    en: "-- Choose an available country --",
    ja: "-- 担当する国を選択 --",
  },
  deployForces: {
    en: "Deploy Forces / Join War Room",
    ja: "出撃 / 作戦室に入る",
  },
  hostPin: { en: "Host / GM PIN (Admin Password)", ja: "GM用管理者PINコード" },
  hostPinPlaceholder: {
    en: "4-digit PIN (e.g. 1937)",
    ja: "4桁のPIN (例: 1937)",
  },
  roundTimerSetting: { en: "Round Duration", ja: "1ラウンドの制限時間" },
  initSession: {
    en: "Initialize War Room (Create Game)",
    ja: "ゲームセッションを開始",
  },
  roomLockedNotice: {
    en: "⚠️ This room has been locked by the GM.",
    ja: "⚠️ このルームはGMによって締切/施錠されています。",
  },
  countryTakenNotice: { en: "Occupied by team", ja: "既に参加者がいます" },
  countryAvailable: { en: "Available", ja: "選択可能" },

  // Command Center & Actions
  commandCenter: { en: "Command Center", ja: "国家作戦司令部" },
  selectAction: { en: "-- Select Action --", ja: "-- 行動を選択 --" },
  selectTarget: { en: "-- Select Target Country --", ja: "-- 対象国を選択 --" },
  targetRequired: {
    en: "Target country required",
    ja: "対象国を選択してください",
  },
  executeOrder: { en: "Execute Order", ja: "指令を実行する" },
  executing: { en: "Executing...", ja: "実行中..." },
  internalActions: {
    en: "Internal Development Actions",
    ja: "国内開発アクション",
  },
  diplomaticActions: {
    en: "Diplomatic & Military Actions",
    ja: "外交・軍事アクション",
  },
  oddsSuccess: { en: "Success Rate", ja: "成功確率" },
  cost: { en: "Cost", ja: "コスト" },
  reward: { en: "Reward", ja: "獲得" },

  // Resources
  vp: { en: "VP", ja: "勝利点" },
  econ: { en: "Economy", ja: "経済" },
  mil: { en: "Military", ja: "軍事" },
  pol: { en: "Politics", ja: "政治" },
  dip: { en: "Diplomacy", ja: "外交" },
  allies: { en: "Allies", ja: "同盟国" },
  status: { en: "Status", ja: "状態" },
  active: { en: "Active", ja: "健在" },
  puppet: { en: "Puppet", ja: "属国 (傀儡)" },
  master: { en: "Master", ja: "宗主国" },

  // GM War Room Controls
  gmControls: {
    en: "Gamemaster War Room Controls",
    ja: "GM (教員) 管理パネル",
  },
  enterGmPin: {
    en: "Enter GM PIN to unlock controls:",
    ja: "GM PINコードを入力してロック解除:",
  },
  unlock: { en: "Unlock", ja: "解除" },
  lockRoom: {
    en: "Close / Lock Room (No New Joins)",
    ja: "ルーム締切 (新規参加を禁止)",
  },
  unlockRoom: { en: "Open Room to Joins", ja: "ルーム開放 (新規参加を許可)" },
  pause: { en: "Pause Game", ja: "ゲーム一時停止" },
  resume: { en: "Resume Game", ja: "ゲーム再開" },
  nextRound: { en: "Advance to Next Round", ja: "次のラウンドへ進む" },
  resetRoundTimer: { en: "Reset Timer", ja: "タイマーをリセット" },
  triggerRandomEvent: {
    en: "Trigger Random Event Now",
    ja: "ランダムイベントを発動",
  },
  modifyResources: {
    en: "Award Bonus / Modify Stats",
    ja: "資源調整 / 外交点付与",
  },

  // Tabs & Views
  tabCommand: { en: "Command & Actions", ja: "作戦指令" },
  tabDashboard: { en: "World Standings", ja: "世界情勢・順位" },
  tabDiplomacy: { en: "Diplomatic Matrix", ja: "外交関係表" },
  tabRules: { en: "Rules & Victory Goals", ja: "ルール・勝利条件" },
  tabDossier: { en: "National Dossier", ja: "国家機密ファイル" },

  // News Ticker
  newsTicker: {
    en: "1937 Global Wire / News Ticker",
    ja: "1937年 国際情勢速報",
  },
  filterAll: { en: "All News", ja: "全速報" },
  filterBattles: { en: "Battles & Wars", ja: "戦闘・戦争" },
  filterTreaties: { en: "Treaties & Alliances", ja: "条約・同盟" },
  filterEvents: { en: "Global Events", ja: "世界出来事" },

  // End Game
  gameOver: {
    en: "GAME OVER / FINAL STANDINGS",
    ja: "ゲーム終了 / 最終結果発表",
  },
  winner: { en: "Dominant Power", ja: "覇権国家" },
  rank: { en: "Rank", ja: "順位" },
};
