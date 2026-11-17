import { INITIAL_COUNTRIES } from "@/lib/gameEngine";
import { allies, type Country, type State } from "@/lib/classroom";
import {
  text,
  copy,
  goals,
  countryName,
  RESOURCE_INFO,
  scoringBreakdown,
  type Lang,
} from "@/lib/presentation";
import ResourceDisplay from "./ResourceDisplay";
export default function CountryDossier({
  country: c,
  state: s,
  lang,
  briefing = false,
  onReady,
  onPractice,
}: {
  country: Country;
  state: State;
  lang: Lang;
  briefing?: boolean;
  onReady?: () => void;
  onPractice?: () => void;
}) {
  const d = INITIAL_COUNTRIES.find((d) => d.name_en === c.name)!,
    g = goals(c),
    points = scoringBreakdown(c, allies(s, c.name).length),
    L = (en: string, ja: string) => text(lang, copy(en, ja));
  return (
    <section
      className={"dossier panel " + (briefing ? "country-briefing" : "")}
      aria-label={L("Your country briefing", "自国の概要")}
    >
      <div className="dossier-cover">
        <span className="eyebrow">{L("National dossier", "国家資料")}</span>
        <h2>{countryName(c.name, lang)}</h2>
        <p>{text(lang, copy(d.history_en, d.history_ja))}</p>
      </div>
      <div className="panel-body">
        <h3>{L("Your country briefing", "自国の概要")}</h3>
        <ResourceDisplay country={c} lang={lang} explain={briefing} />
        {c.master && (
          <p className="notice">
            {L("Your country is occupied by", "現在の占領国：")}{" "}
            {countryName(c.master, lang)}.{" "}
            {L(
              "You can rebuild and work towards independence.",
              "復興と抵抗で独立を目指せます。",
            )}
          </p>
        )}
        <h3>
          {L("How your country earns victory points", "自国の得点の獲得方法")}
        </h3>
        <details open={briefing}>
          <summary>{L("How this works", "得点の仕組み")}</summary>
          <p>
            {L(
              "Every round: 1 victory point for taking part. Independent countries also earn these bonuses:",
              "毎ラウンド、参加している国に勝利点1。独立国は次の追加点も獲得します。",
            )}
          </p>
          <ul className="goal-list">
            <li>{text(lang, g.primary)}</li>
            <li>{text(lang, g.secondary)}</li>
          </ul>
        </details>
        <label className="goal-progress">
          {text(lang, RESOURCE_INFO[g.resource])}: {c[g.resource]} / {g.target}
          <progress value={Math.min(c[g.resource], g.target)} max={g.target} />
        </label>
        <p className="score-line">
          {L(
            "At these levels, next round-end score:",
            "現在の状態でラウンドが終了すると：",
          )}{" "}
          <strong>
            {points.total} {L("victory points", "勝利点")}
          </strong>
        </p>
        <small>
          {L(
            "This can change before the round ends.",
            "終了までの変化によって得点は変わります。",
          )}
        </small>
        <h3>{L("Your national advantage", "国の特殊能力")}</h3>
        <details open={briefing}>
          <summary>
            {c.special
              ? L("Already used", "使用済み")
              : L("Read your special power", "特殊能力を確認")}
          </summary>
          <p>
            <strong>
              {text(lang, copy(d.special_title_en, d.special_title_ja))}
            </strong>
          </p>
          <p>
            {text(lang, copy(d.special_desc_en, d.special_desc_ja))}{" "}
            {L(
              "Uses one team action. Available once per game.",
              "チームの1行動を使用。ゲーム中1回のみ。",
            )}
          </p>
          <span className="status-label">
            {c.special
              ? L("Already used", "使用済み")
              : L("Available", "未使用")}
          </span>
          <p className="advice">
            <strong>{L("Opening suggestion", "最初の行動のヒント")}</strong>
            <br />
            {text(lang, g.suggestion)}
          </p>
        </details>
        {onReady && (
          <button className="primary" onClick={onReady}>
            {L("Enter the command room", "作戦室へ進む")}
          </button>
        )}
        {onPractice && (
          <button onClick={onPractice}>
            {L("Try the 2-minute practice", "2分間の練習を試す")}
          </button>
        )}
      </div>
    </section>
  );
}
