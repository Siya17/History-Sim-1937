"use client";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ServerError } from "@/lib/client";
import { INITIAL_COUNTRIES, EVENT_DECK } from "@/lib/gameEngine";
import {
  ORDERS,
  PHASE_NAMES,
  ORDER_DETAILS_JA,
  RESOURCES,
  allies,
  type Command,
  type State,
} from "@/lib/classroom";
type View = {
  room: string;
  title: string;
  state: State;
  teacher: boolean;
  country: string | null;
  serverNow: number;
  teams: { country: string; name: string }[];
};
export default function DashboardClient({ roomCode }: { roomCode: string }) {
  const router = useRouter();
  const [view, setView] = useState<View | null>(null),
    [error, setError] = useState(""),
    [connected, setConnected] = useState(false),
    [lastSync, setLastSync] = useState(0),
    [now, setNow] = useState(0),
    [offset, setOffset] = useState(0),
    [tab, setTab] = useState("command"),
    [lang, setLang] = useState("dual"),
    [busy, setBusy] = useState(false),
    [action, setAction] = useState("BUILD_ECON"),
    [target, setTarget] = useState(""),
    [category, setCategory] = useState("ALL"),
    [secret, setSecret] = useState(""),
    [projection, setProjection] = useState(false),
    [qr, setQr] = useState(""),
    [pending, setPending] = useState<{
      command: Command;
      requestId: string;
    } | null>(null);
  const L = (en: string, ja: string) =>
    lang === "en" ? en : lang === "ja" ? ja : `${en} / ${ja}`;
  const refresh = useCallback(async () => {
    try {
      const next = await api<View>({ op: "state", room: roomCode });
      setView(next);
      setNow(Date.now());
      setOffset(next.serverNow - Date.now());
      setLastSync(Date.now());
      setConnected(true);
      return next.state.phase;
    } catch (e) {
      setConnected(false);
      setError(e instanceof Error ? e.message : "Connection failed");
    }
  }, [roomCode]);
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      const phase = await refresh();
      if (!stopped)
        timer = setTimeout(poll, phase === "RUNNING" ? 2500 : 10000);
    }
    poll();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [refresh]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    Promise.resolve().then(() => {
      const saved = sessionStorage.getItem("pending_" + roomCode);
      if (saved) {
        try {
          setPending(JSON.parse(saved));
        } catch {
          sessionStorage.removeItem("pending_" + roomCode);
        }
      }
    });
  }, [roomCode]);
  async function send(command: Command, retryId?: string) {
    if (pending && !retryId) {
      setError(
        L(
          "Resolve the pending request first.",
          "保留中の操作を先に確認してください。",
        ),
      );
      return;
    }
    setBusy(true);
    setError("");
    const request = {
      command: { ...command, round: command.round ?? view?.state.round },
      requestId: retryId ?? crypto.randomUUID(),
    };
    setPending(request);
    sessionStorage.setItem("pending_" + roomCode, JSON.stringify(request));
    try {
      await api({ op: "command", room: roomCode, ...request });
      setPending(null);
      sessionStorage.removeItem("pending_" + roomCode);
    } catch (e) {
      if (e instanceof ServerError) {
        setPending(null);
        sessionStorage.removeItem("pending_" + roomCode);
      }
      setError(
        e instanceof Error
          ? e.message
          : "Connection interrupted. Retry the pending request.",
      );
    } finally {
      await refresh();
      setBusy(false);
    }
  }
  async function roster(op: string, country: string) {
    if (
      !confirm(
        L(
          "This changes team access. Continue?",
          "チームのアクセス権を変更します。続行しますか？",
        ),
      )
    )
      return;
    try {
      const r = await api<{ code?: string }>({ op, room: roomCode, country });
      if (r.code) setSecret(country + ": " + r.code);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function download(csv = false) {
    try {
      const r = await api<{ export: unknown }>({
        op: "export",
        room: roomCode,
      });
      let content = JSON.stringify(r.export, null, 2);
      if (csv && view) {
        const rows = [
          [
            "Country",
            "Economy",
            "Military",
            "Politics",
            "Diplomacy",
            "VP",
            "Occupier",
          ],
          ...view.state.countries.map((c) => [
            c.name,
            c.econ,
            c.mil,
            c.pol,
            c.dip,
            c.vp,
            c.master ?? "",
          ]),
        ];
        content =
          "\uFEFF" +
          rows
            .map((row) =>
              row
                .map((v) => '"' + String(v).replaceAll('"', '""') + '"')
                .join(","),
            )
            .join("\r\n");
      }
      const url = URL.createObjectURL(
        new Blob([content], {
          type: csv ? "text/csv;charset=utf-8" : "application/json",
        }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = roomCode + (csv ? ".csv" : ".json");
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  if (!view)
    return (
      <main className="shell">
        <Link href="/">← {L("Home / join", "ホーム・参加")}</Link>
        <section className="card">
          <h1>{roomCode}</h1>
          <p role="status">
            {error || L("Connecting to classroom…", "接続中…")}
          </p>
          <button onClick={refresh}>{L("Reconnect", "再接続")}</button>
        </section>
      </main>
    );
  const s = view.state,
    c = s.countries.find((c) => c.name === view.country);
  const remaining =
    s.phase === "PAUSED"
      ? s.remaining
      : s.deadline
        ? Math.max(0, (s.deadline - now - offset) / 1000)
        : 0;
  const active =
    s.phase === "RUNNING" && remaining > 0 && connected && !busy && !pending;
  const sorted = [...s.countries].sort((a, b) => b.vp - a.vp);
  const event = EVENT_DECK.find((e) => e.code === s.event);
  const selectedAction = c?.master
    ? ["REBUILD", "RESIST"].includes(action)
      ? action
      : "REBUILD"
    : ["REBUILD", "RESIST"].includes(action)
      ? "BUILD_ECON"
      : action;
  const treaty = ["TRADE", "ALLIANCE"].includes(selectedAction);
  const targetRequired =
    treaty || ["WAR", "SPY", "BREAK"].includes(selectedAction);
  const name = (n: string) => {
    const d = INITIAL_COUNTRIES.find((c) => c.name_en === n);
    return d ? d.flag + " " + L(d.name_en, d.name_ja) : n;
  };
  return (
    <main className={"shell " + (projection ? "projected" : "")}>
      <header className="mast">
        <Link className="brand" href="/">
          1937 <span>{roomCode}</span>
        </Link>
        <nav>
          {["dual", "en", "ja"].map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
            >
              {l === "dual" ? "EN / 日本語" : l}
            </button>
          ))}
          {view.teacher && (
            <button onClick={() => setProjection(!projection)}>
              {projection
                ? L("Exit projection", "投影を終了")
                : L("Projector", "投影表示")}
            </button>
          )}
        </nav>
      </header>
      <section className="roundbar">
        <div>
          <p className="eyebrow">
            {L("Classroom Rules v2", "教室版ルール v2")} ·{" "}
            {L(PHASE_NAMES[s.phase].en, PHASE_NAMES[s.phase].ja)}
          </p>
          <h1>{view.title}</h1>
          <p>
            {L("Round", "ラウンド")} {s.round} / {s.totalRounds}
          </p>
        </div>
        <div
          className={
            "timer " + (remaining < 30 && s.phase === "RUNNING" ? "urgent" : "")
          }
        >
          {Math.floor(Math.ceil(remaining) / 60)}:
          {String(Math.ceil(remaining) % 60).padStart(2, "0")}
        </div>
      </section>
      <p role="status" className={connected ? "connection" : "error"}>
        {connected
          ? L("Connected", "接続済み")
          : L("Disconnected — orders disabled", "切断中 — 行動できません")}{" "}
        · {lastSync ? new Date(lastSync).toLocaleTimeString() : ""}{" "}
        <button onClick={refresh}>{L("Refresh", "更新")}</button>
      </p>
      {pending && (
        <p className="notice card">
          {L(
            "An order is awaiting confirmation. Retrying will not spend it twice.",
            "操作の結果を確認中です。再試行しても二重に消費しません。",
          )}
          <button
            disabled={busy || !connected}
            onClick={() => send(pending.command, pending.requestId)}
          >
            {L("Retry pending request", "保留操作を再試行")}
          </button>
        </p>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
          <button onClick={() => setError("")}>×</button>
        </p>
      )}
      {secret && !projection && (
        <section className="card notice">
          <p>
            {L(
              "New team code — share securely with the team",
              "新しいチームコード — 対象チームだけに共有",
            )}
          </p>
          <strong className="code">{secret}</strong>
          <button onClick={() => setSecret("")}>
            {L("Dismiss", "閉じる")}
          </button>
        </section>
      )}
      {s.phase === "LOBBY" && (
        <section className="card notice">
          <h2>{L("Gather your teams", "チームを集めましょう")}</h2>
          <p>
            {L(
              "At least two claimed countries are needed. Unclaimed countries are excluded when the teacher starts.",
              "2か国以上が必要です。未参加の国は開始時に除外されます。",
            )}
          </p>
          <p className="code">{roomCode}</p>
          <button
            onClick={() =>
              navigator.clipboard.writeText(
                location.origin + "/?room=" + roomCode,
              )
            }
          >
            {L("Copy join link", "参加リンクをコピー")}
          </button>
          {view.teacher && (
            <>
              <button
                onClick={async () => {
                  const QR = await import("qrcode");
                  setQr(
                    await QR.toDataURL(location.origin + "/?room=" + roomCode, {
                      width: 240,
                      margin: 2,
                    }),
                  );
                }}
              >
                {L("Show join QR", "参加QRを表示")}
              </button>
              {qr && (
                <Image
                  src={qr}
                  alt="Classroom join QR code"
                  width={240}
                  height={240}
                  unoptimized
                />
              )}
            </>
          )}
          <p>
            {L(
              "Open the home page and enter this room code to join.",
              "ホームページでルームコードを入力して参加してください。",
            )}
          </p>
        </section>
      )}
      {event && s.phase !== "LOBBY" && (
        <aside className="event">
          <strong>{L(event.name_en, event.name_ja)}</strong>
          <p>{L(event.desc_en, event.desc_ja)}</p>
        </aside>
      )}
      {["BETWEEN_ROUNDS", "FINISHED", "ARCHIVED"].includes(s.phase) && (
        <section className="card notice">
          <h2>
            {s.phase === "BETWEEN_ROUNDS"
              ? L("Debrief time", "振り返りの時間")
              : L("Final results", "最終結果")}
          </h2>
          {s.phase !== "BETWEEN_ROUNDS" && (
            <p className="winner">
              {sorted
                .filter((c) => c.vp === sorted[0]?.vp)
                .map((c) => name(c.name))
                .join(" + ")}
            </p>
          )}
          <p>
            {L(
              "Orders are closed. Review the scores and discuss the decisions.",
              "行動受付は終了しました。得点を確認し、判断を振り返りましょう。",
            )}
          </p>
          {s.summaries.at(-1) && (
            <div className="chips">
              {Object.entries(s.summaries.at(-1)!.scores).map(([n, v]) => (
                <span key={n}>
                  {name(n)} +{v} VP
                </span>
              ))}
            </div>
          )}
        </section>
      )}
      <nav className="tabs" aria-label="Classroom views">
        {[
          "command",
          "standings",
          "diplomacy",
          "rules",
          ...(view.teacher && !projection ? ["teacher"] : []),
        ].map((t) => (
          <button key={t} onClick={() => setTab(t)} aria-pressed={tab === t}>
            {L(
              {
                command: "Orders",
                standings: "Standings",
                diplomacy: "Diplomacy",
                rules: "Rules",
                teacher: "Teacher",
              }[t]!,
              {
                command: "行動",
                standings: "順位",
                diplomacy: "外交",
                rules: "ルール",
                teacher: "教員",
              }[t]!,
            )}
          </button>
        ))}
      </nav>
      <div className="grid workspace">
        <section>
          {tab === "command" && !projection && (
            <section className="card">
              <h2>
                {c
                  ? name(c.name)
                  : L("Teacher command overview", "教員用状況表示")}
              </h2>
              {c ? (
                <>
                  <div className="chips">
                    {RESOURCES.map((r) => (
                      <span key={r}>
                        {r.toUpperCase()} <strong>{c[r]}</strong>
                      </span>
                    ))}
                    <span>VP {c.vp}</span>
                    <span>
                      {2 - c.used}/2 {L("orders left", "残り行動")}
                    </span>
                  </div>
                  {c.master && (
                    <p className="error">
                      {L("Occupied by", "占領国")}: {name(c.master)} ·{" "}
                      {L(
                        "Rebuild or resist to regain independence.",
                        "復興や抵抗で独立を取り戻しましょう。",
                      )}
                    </p>
                  )}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      send({
                        type: treaty ? "PROPOSE" : "ORDER",
                        action: selectedAction,
                        target: target || undefined,
                      });
                    }}
                  >
                    <label>
                      {L("Choose an order", "行動を選ぶ")}
                      <select
                        value={selectedAction}
                        onChange={(e) => setAction(e.target.value)}
                      >
                        {ORDERS.filter((a) =>
                          c.master
                            ? ["REBUILD", "RESIST"].includes(a[0])
                            : !["REBUILD", "RESIST"].includes(a[0]),
                        ).map((a) => (
                          <option value={a[0]} key={a[0]}>
                            {L(a[1], a[2])}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p>
                      {L(
                        ORDERS.find((a) => a[0] === selectedAction)?.[3] ?? "",
                        ORDER_DETAILS_JA[selectedAction] ?? "",
                      )}
                    </p>
                    {targetRequired && (
                      <label>
                        {L("Target country", "対象国")}
                        <select
                          value={target}
                          onChange={(e) => setTarget(e.target.value)}
                          required
                        >
                          <option value="">—</option>
                          {s.countries
                            .filter((t) => t.name !== c.name && !t.master)
                            .map((t) => (
                              <option key={t.name} value={t.name}>
                                {name(t.name)}
                              </option>
                            ))}
                        </select>
                      </label>
                    )}
                    <button
                      className="primary"
                      disabled={!active || c.used >= 2}
                    >
                      {treaty
                        ? L("Send proposal", "提案を送る")
                        : L("Execute order", "行動を実行")}
                    </button>
                  </form>
                  <p>
                    {L(
                      "Both teammates share these two orders. Proposals charge both teams only when accepted.",
                      "行動2回はチーム全員で共有します。条約は承認時に双方の行動と資源を消費します。",
                    )}
                  </p>
                </>
              ) : (
                <p>
                  {L(
                    "Use the teacher tab to control the class.",
                    "教員タブで授業の進行を操作してください。",
                  )}
                </p>
              )}
            </section>
          )}
          {(tab === "standings" || projection) && (
            <section className="card tablewrap">
              <h2>{L("World standings", "世界情勢・順位")}</h2>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{L("Country", "国")}</th>
                    {RESOURCES.map((r) => (
                      <th key={r}>{r}</th>
                    ))}
                    <th>VP</th>
                    <th>{L("Status", "状態")}</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((n) => (
                    <tr key={n.name}>
                      <td>{sorted.findIndex((x) => x.vp === n.vp) + 1}</td>
                      <th>{name(n.name)}</th>
                      {RESOURCES.map((r) => (
                        <td key={r}>{n[r]}</td>
                      ))}
                      <td className="points">{n.vp}</td>
                      <td>
                        {n.master
                          ? L("Occupied", "占領中") + " · " + n.master
                          : L("Independent", "独立")}
                        <small>
                          {view.teams.find((t) => t.country === n.name)?.name}
                        </small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
          {tab === "diplomacy" && !projection && (
            <>
              <section className="card">
                <h2>{L("Treaty inbox", "条約の受信箱")}</h2>
                {s.proposals
                  .filter(
                    (p) =>
                      view.teacher || p.from === c?.name || p.to === c?.name,
                  )
                  .slice()
                  .reverse()
                  .map((p) => (
                    <article className="proposal" key={p.id}>
                      <strong>
                        {name(p.from)} → {name(p.to)}
                      </strong>
                      <p>
                        {p.kind} · R{p.round} · {p.status}
                      </p>
                      {p.status === "PENDING" && p.to === c?.name && (
                        <>
                          <button
                            disabled={!active}
                            onClick={() =>
                              send({ type: "ACCEPT", proposalId: p.id })
                            }
                          >
                            {L("Accept", "承認")}
                          </button>
                          <button
                            disabled={!active}
                            onClick={() =>
                              send({ type: "DECLINE", proposalId: p.id })
                            }
                          >
                            {L("Decline", "拒否")}
                          </button>
                        </>
                      )}
                      {p.status === "PENDING" && p.from === c?.name && (
                        <button
                          disabled={!active}
                          onClick={() =>
                            send({ type: "CANCEL", proposalId: p.id })
                          }
                        >
                          {L("Cancel", "取消")}
                        </button>
                      )}
                    </article>
                  ))}
              </section>
              <section className="card">
                <h2>{L("Diplomatic relationships", "外交関係")}</h2>
                {s.countries.map((c) => (
                  <p key={c.name}>
                    <strong>{name(c.name)}</strong>
                    <br />
                    {L("Allies", "同盟国")}:{" "}
                    {allies(s, c.name).map(name).join(", ") || "—"}
                    {c.master &&
                      " · " +
                        L("Occupied by", "占領国") +
                        ": " +
                        name(c.master)}
                  </p>
                ))}
              </section>
            </>
          )}
          {tab === "rules" && !projection && (
            <section className="card">
              <h2>{L("Classroom Rules v2", "教室版ルール v2")}</h2>
              <p>
                {L(
                  "Two shared orders per round. Invalid actions cost nothing. Failed rolls still use an order. Resources: 0–15. VP: uncapped.",
                  "1ラウンド2行動をチームで共有。無効な行動は無料ですが、判定失敗でも行動を消費します。資源は0〜15、VPの上限はありません。",
                )}
              </p>
              {ORDERS.map((a) => (
                <article key={a[0]}>
                  <h3>{L(a[1], a[2])}</h3>
                  <p>{L(a[3], ORDER_DETAILS_JA[a[0]])}</p>
                </article>
              ))}
              <h3>{L("Combat and occupation", "戦闘と占領")}</h3>
              <p>
                {L(
                  "Ties favor defense. Victory: +3 VP, loot up to 3 Econ, target loses 3 Econ and Mil. Defeat: lose 2 more Mil, defender +2 VP. Zero Econ or Mil after victory means occupation. Occupiers receive 1 Econ tribute when a puppet has more than 1 Econ. Resistance succeeds on 6–10; independence restores Econ and Mil to at least 3. Conquering an occupier frees its countries (+2 VP each).",
                  "同点は防衛側勝利。攻撃勝利は+3VP、経済を最大3略奪し相手の経済・軍事を3減少。敗北は軍事を追加2消費、防衛側+2VP。勝利後に相手の経済か軍事が0なら占領。占領国の経済が2以上なら毎ラウンド経済1を貢納。抵抗は6〜10で成功し、独立時に経済・軍事を最低3へ。占領者を征服すると属国を解放し1国につき+2VP。",
                )}
              </p>
              <h3>{L("Round scoring", "ラウンド得点")}</h3>
              <p>
                {L(
                  "Everyone: +1 VP. Independent countries also earn ideology bonuses:",
                  "全国: +1VP。独立国は陣営ボーナスも獲得:",
                )}
              </p>
              <ul>
                <li>
                  Fascist / ファシスト: Mil ≥10 +2, else ≥9 +1; 3 allies /
                  同盟3国 +1.
                </li>
                <li>
                  Liberal / 自由主義: Econ ≥10 +2, else ≥9 +1; 3 allies /
                  同盟3国 +1.
                </li>
                <li>Communist / 共産主義: Pol ≥9 +2, else ≥8 +1; Mil ≥8 +1.</li>
                <li>
                  Neutral / 中立: Econ ≥8 AND Mil ≥5 +2; else Econ ≥7 OR Mil ≥4
                  +1; Dip ≥7 +1.
                </li>
              </ul>
              {c && (
                <>
                  <h3>{L("Your country briefing", "自国の概要")}</h3>
                  <p>
                    {L(
                      INITIAL_COUNTRIES.find((d) => d.name_en === c.name)!
                        .special_desc_en,
                      INITIAL_COUNTRIES.find((d) => d.name_en === c.name)!
                        .special_desc_ja,
                    )}
                  </p>
                  <p>
                    {L(
                      INITIAL_COUNTRIES.find((d) => d.name_en === c.name)!
                        .history_en,
                      INITIAL_COUNTRIES.find((d) => d.name_en === c.name)!
                        .history_ja,
                    )}
                  </p>
                </>
              )}
            </section>
          )}
          {tab === "teacher" && view.teacher && !projection && (
            <section className="card">
              <h2>{L("Teacher controls", "教員の操作")}</h2>
              <div className="controls">
                {(s.phase === "LOBBY" || s.phase === "BETWEEN_ROUNDS") && (
                  <button
                    className="primary"
                    disabled={busy}
                    onClick={() => send({ type: "START" })}
                  >
                    {L("Start next round", "次のラウンド開始")}
                  </button>
                )}
                {s.phase === "RUNNING" && (
                  <button onClick={() => send({ type: "PAUSE" })}>
                    {L("Pause", "一時停止")}
                  </button>
                )}
                {s.phase === "PAUSED" && (
                  <button onClick={() => send({ type: "RESUME" })}>
                    {L("Resume", "再開")}
                  </button>
                )}
                {["RUNNING", "PAUSED"].includes(s.phase) && (
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          L(
                            "Close and score this round now?",
                            "今すぐラウンドを締めて採点しますか？",
                          ),
                        )
                      )
                        send({ type: "CLOSE" });
                    }}
                  >
                    {L("Close round early", "ラウンドを終了")}
                  </button>
                )}
                {s.phase === "LOBBY" && (
                  <button onClick={() => send({ type: "LOCK" })}>
                    {s.locked
                      ? L("Open joining", "参加受付を開く")
                      : L("Lock joining", "参加受付を締切")}
                  </button>
                )}
                {["FINISHED", "LOBBY"].includes(s.phase) && (
                  <button onClick={() => send({ type: "ARCHIVE" })}>
                    {L("Archive", "アーカイブ")}
                  </button>
                )}
                <button onClick={() => download()}>
                  {L("Export JSON backup", "JSONバックアップ")}
                </button>
                <button onClick={() => download(true)}>
                  {L("Export CSV results", "CSV得点表")}
                </button>
                <button
                  onClick={async () => {
                    try {
                      const r = await api<{ room: string }>({
                        op: "create",
                        title: view.title,
                        rounds: s.totalRounds,
                        duration: s.duration,
                      });
                      router.push("/dashboard/" + r.room);
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  {L("Create rematch", "再戦用ルーム作成")}
                </button>
                {["LOBBY", "FINISHED", "ARCHIVED"].includes(s.phase) && (
                  <button
                    className="danger"
                    onClick={async () => {
                      if (
                        prompt(
                          L(
                            "Type the room code to permanently delete this game",
                            "完全削除するにはルームコードを入力",
                          ),
                        ) !== roomCode
                      )
                        return;
                      try {
                        await api({ op: "delete", room: roomCode });
                        router.push("/");
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    {L("Delete game", "ゲーム削除")}
                  </button>
                )}
              </div>
              <h3>{L("Class roster", "参加チーム")}</h3>
              {view.teams.map((t) => (
                <article className="proposal" key={t.country}>
                  <strong>
                    {name(t.country)} · {t.name}
                  </strong>
                  <div>
                    <button onClick={() => roster("rotate", t.country)}>
                      {L(
                        "Reset team code / revoke devices",
                        "コード更新・端末解除",
                      )}
                    </button>
                    <button onClick={() => roster("revoke", t.country)}>
                      {L("Revoke devices", "端末を解除")}
                    </button>
                    {s.phase === "LOBBY" && (
                      <button onClick={() => roster("remove", t.country)}>
                        {L("Remove team", "チームを削除")}
                      </button>
                    )}
                  </div>
                </article>
              ))}
              <h3>{L("Award or adjust resources", "資源・得点の調整")}</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  send({
                    type: "ADJUST",
                    target: String(f.get("target")),
                    resource: String(f.get("resource")),
                    delta: Number(f.get("delta")),
                    reason: String(f.get("reason")),
                  });
                }}
              >
                <select name="target" aria-label="Country">
                  {s.countries.map((c) => (
                    <option key={c.name}>{c.name}</option>
                  ))}
                </select>
                <select name="resource" aria-label="Resource">
                  {[...RESOURCES, "vp"].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
                <input
                  name="delta"
                  type="number"
                  min={-15}
                  max={15}
                  defaultValue={1}
                  aria-label="Change"
                />
                <label>
                  {L("Reason (required)", "理由（必須）")}
                  <input name="reason" required maxLength={300} />
                </label>
                <button
                  disabled={busy || ["FINISHED", "ARCHIVED"].includes(s.phase)}
                >
                  {L("Apply adjustment", "調整を適用")}
                </button>
              </form>
            </section>
          )}
        </section>
        <aside className="card news">
          <h2>{L("Global wire", "国際情勢速報")}</h2>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="News category"
          >
            {["ALL", "ACTION", "TREATY", "WAR", "EVENT", "ROUND", "GM"].map(
              (t) => (
                <option key={t}>{t}</option>
              ),
            )}
          </select>
          <div className="stream">
            {s.events
              .filter((e) => category === "ALL" || e.category === category)
              .slice()
              .reverse()
              .map((e) => (
                <article key={e.sequence}>
                  <small>
                    R{e.round} · {new Date(e.at).toLocaleTimeString()} ·{" "}
                    {e.category}
                  </small>
                  <p>{L(e.message.en, e.message.ja)}</p>
                  {e.changes?.map((change) => (
                    <small key={change.country}>
                      {name(change.country)}:{" "}
                      {[...RESOURCES, "vp" as const]
                        .filter((r) => change.before[r] !== change.after[r])
                        .map(
                          (r) =>
                            `${r.toUpperCase()} ${change.after[r] - change.before[r] > 0 ? "+" : ""}${change.after[r] - change.before[r]}`,
                        )
                        .join(" · ")}
                      {change.before.master !== change.after.master
                        ? " · " +
                          (change.after.master
                            ? L("Occupied", "占領中")
                            : L("Independent", "独立"))
                        : ""}
                    </small>
                  ))}
                  {e.draws.length > 0 && (
                    <small>🎲 {e.draws.join(" · ")}</small>
                  )}
                </article>
              ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
