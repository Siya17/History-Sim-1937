import { useState } from "react";
import { allies, type State } from "@/lib/classroom";
import {
  RESOURCE_INFO,
  text,
  copy,
  countryName,
  eventTitle,
  type Lang,
  type Resource,
} from "@/lib/presentation";
export default function WorldSituation({
  state: s,
  lang,
}: {
  state: State;
  lang: Lang;
}) {
  const [filter, setFilter] = useState("ALL"),
    L = (en: string, ja: string) => text(lang, copy(en, ja)),
    sorted = [...s.countries].sort((a, b) => b.vp - a.vp);
  const categories = {
    ALL: copy("All developments", "すべての出来事"),
    ACTION: copy("Country decisions", "国の行動"),
    TREATY: copy("Diplomatic agreements", "外交の合意"),
    WAR: copy("Battles and liberation", "戦闘と解放"),
    EVENT: copy("World events", "世界の出来事"),
    ROUND: copy("Round summaries", "ラウンドの得点"),
    GM: copy("Teacher announcements", "教員からの連絡"),
  };
  return (
    <>
      <section className="panel">
        <div className="panel-body tablewrap">
          <h2>{L("World situation", "世界の状況")}</h2>
          <table>
            <thead>
              <tr>
                <th>{L("Place", "順位")}</th>
                <th>{L("Country", "国")}</th>
                {(Object.keys(RESOURCE_INFO) as Resource[]).map((r) => (
                  <th key={r}>{text(lang, RESOURCE_INFO[r])}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr key={c.name}>
                  <td>{sorted.findIndex((t) => t.vp === c.vp) + 1}</td>
                  <th>
                    {countryName(c.name, lang)}
                    <small>
                      {c.master
                        ? L("Occupied by", "占領国：") +
                          " " +
                          countryName(c.master, lang)
                        : L("Independent", "独立")}
                      <br />
                      {L("Allies", "同盟国")}:{" "}
                      {allies(s, c.name)
                        .map((n) => countryName(n, lang))
                        .join(", ") || L("None", "なし")}
                    </small>
                  </th>
                  {(Object.keys(RESOURCE_INFO) as Resource[]).map((r) => (
                    <td key={r}>{c[r]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <div className="panel-body">
          <h2>{L("Dispatch history", "これまでの連絡")}</h2>
          <label>
            {L("Show developments", "表示する出来事")}
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              {Object.entries(categories).map(([key, label]) => (
                <option key={key} value={key}>
                  {text(lang, label)}
                </option>
              ))}
            </select>
          </label>
          {s.events
            .filter((e) => filter === "ALL" || e.category === filter)
            .slice()
            .reverse()
            .map((e) => (
              <article className="dispatch" key={e.sequence}>
                <small>
                  {L("Round", "ラウンド")} {e.round} ·{" "}
                  {new Date(e.at).toLocaleTimeString()}
                </small>
                <h3>{eventTitle(e, lang)}</h3>
                {e.changes?.map((change) => (
                  <p key={change.country}>
                    {countryName(change.country, lang)}:{" "}
                    {(Object.keys(RESOURCE_INFO) as Resource[])
                      .filter((r) => change.before[r] !== change.after[r])
                      .map(
                        (r) =>
                          text(lang, RESOURCE_INFO[r]) +
                          " " +
                          (change.after[r] - change.before[r] > 0 ? "+" : "") +
                          (change.after[r] - change.before[r]),
                      )
                      .join(" · ")}
                    {change.before.master !== change.after.master
                      ? " · " +
                        (change.after.master
                          ? L("Occupied", "占領中")
                          : L("Independent", "独立"))
                      : ""}
                  </p>
                ))}
                {e.draws.length > 0 && (
                  <details>
                    <summary>
                      {L("See die results", "サイコロの結果を見る")}
                    </summary>
                    <p>{e.draws.join(" · ")}</p>
                  </details>
                )}
              </article>
            ))}
        </div>
      </section>
    </>
  );
}
