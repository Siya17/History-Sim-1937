import {
  ACTIONS,
  text,
  copy,
  costText,
  unavailable,
  themeFor,
  countryName,
  RESOURCE_INFO,
  type Lang,
  type ActionId,
  type Resource,
} from "@/lib/presentation";
import {
  allies,
  type State,
  type Country,
  type Command,
} from "@/lib/classroom";
import { INITIAL_COUNTRIES } from "@/lib/gameEngine";
export default function ActionReview({
  state: s,
  country: c,
  lang,
  action,
  target,
  onTarget,
  onClose,
  onSend,
  busy,
}: {
  state: State;
  country: Country;
  lang: Lang;
  action: ActionId;
  target: string;
  onTarget: (s: string) => void;
  onClose: () => void;
  onSend: (cmd: Command) => void;
  busy: boolean;
}) {
  const a = ACTIONS.find((a) => a.id === action)!,
    t = s.countries.find((c) => c.name === target),
    reason = unavailable(s, c, action, lang, t),
    L = (en: string, ja: string) => text(lang, copy(en, ja)),
    theme = themeFor(action, c.name, s.round);
  return (
    <section
      id="action-review"
      className="review-panel panel"
      aria-label={L("Review your decision", "行動の確認")}
      tabIndex={-1}
    >
      <div className="panel-body">
        <div className="section-heading">
          <h2>{text(lang, theme?.title ?? a.title)}</h2>
          <button onClick={onClose}>{L("Close review", "確認を閉じる")}</button>
        </div>
        <p>{text(lang, a.purpose)}</p>
        {theme && (
          <p>
            {L(
              "The story changes each round. This is still the same development action.",
              "物語はラウンドごとに変わりますが、行動の効果は同じです。",
            )}
          </p>
        )}
        {a.target && (
          <label>
            {L("Choose another country", "相手の国を選ぶ")}
            <select value={target} onChange={(e) => onTarget(e.target.value)}>
              <option value="">
                {L("Choose a country", "国を選んでください")}
              </option>
              {s.countries
                .filter(
                  (t) =>
                    t.name !== c.name &&
                    !t.master &&
                    (action !== "BREAK" || allies(s, c.name).includes(t.name)),
                )
                .map((t) => (
                  <option key={t.name} value={t.name}>
                    {countryName(t.name, lang)}
                  </option>
                ))}
            </select>
          </label>
        )}
        <div className="outcome-box">
          <h3>{L("What you spend", "消費するもの")}</h3>
          <p>{costText(action, c, lang, t)}</p>
          <h3>{L("What could happen", "起こりうる結果")}</h3>
          <p>
            {action === "SPECIAL"
              ? text(
                  lang,
                  copy(
                    INITIAL_COUNTRIES.find((d) => d.name_en === c.name)!
                      .special_desc_en,
                    INITIAL_COUNTRIES.find((d) => d.name_en === c.name)!
                      .special_desc_ja,
                  ),
                )
              : text(lang, a.result)}
          </p>
          {["TRADE", "ALLIANCE"].includes(action) && (
            <p>
              {L(
                "Neither team pays when you send this. Both pay only if the other team accepts. Acceptance checks both teams’ remaining actions and resources again.",
                "送信時は双方とも消費しません。相手の承認時に双方が消費します。その時点の行動回数と資源を再確認します。",
              )}
            </p>
          )}
        </div>
        {action === "WAR" && (
          <details>
            <summary>{L("How this works", "仕組みを見る")}</summary>
            <p>
              {L(
                "You must leave an alliance before attacking that ally. Both countries roll a six-sided die and add military strength plus support from allies. Your military strength is counted after paying the attack cost. Each ally adds 2, up to a total of 4. A tie favors the defender.",
                "同盟国を攻撃する前に同盟を解消する必要があります。双方が6面サイコロを振り、軍事力と援軍を加えます。攻撃側は消費後の軍事力を使用。同盟1国につき2、最大4の援軍。同点は防衛側の勝利です。",
              )}
            </p>
            <p>
              {L(
                "Victory: gain 3 victory points; take up to 3 economy; the target loses 3 economy and 3 military strength. Defeat: lose another 2 military strength; the defender gains 2 victory points. If victory leaves the target with no economy or military strength, it becomes occupied.",
                "勝利：勝利点3と経済力を最大3獲得。相手の経済力と軍事力が3減少。敗北：軍事力を追加で2失い、相手が勝利点2を獲得。勝利後に相手の経済力か軍事力が0になると占領します。",
              )}
            </p>
          </details>
        )}
        {t && (
          <p>
            {countryName(t.name, lang)}:{" "}
            {(["econ", "mil", "pol", "dip"] as Resource[])
              .map((r) => text(lang, RESOURCE_INFO[r]) + " " + t[r])
              .join(" · ")}
          </p>
        )}
        {reason && <p className="availability">{reason}</p>}
        <button
          className="primary"
          disabled={busy || !!reason || (a.target && !t)}
          onClick={() =>
            onSend({
              type: ["TRADE", "ALLIANCE"].includes(action)
                ? "PROPOSE"
                : "ORDER",
              action,
              target: a.target ? target : undefined,
            })
          }
        >
          {["TRADE", "ALLIANCE"].includes(action)
            ? L("Send this proposal", "この提案を送る")
            : L("Confirm this action", "この行動を実行")}
        </button>
      </div>
    </section>
  );
}
