"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { api, ServerError } from "@/lib/client";
import { usePreference } from "@/lib/preferences";
import { PHASE_NAMES, type Command, type Event } from "@/lib/classroom";
import { EVENT_DECK } from "@/lib/gameEngine";
import {
  countryName,
  RESOURCE_INFO,
  text,
  copy,
  friendlyError,
  readable,
  type Lang,
  type Resource,
  type ActionId,
} from "@/lib/presentation";
import { getNotices } from "@/lib/notifications";
import type { RoomView } from "@/lib/view";
import CountryDossier from "@/components/classroom/CountryDossier";
import ActionCards from "@/components/classroom/ActionCards";
import ActionReview from "@/components/classroom/ActionReview";
import DispatchCenter from "@/components/classroom/DispatchCenter";
import PracticeTutorial from "@/components/classroom/PracticeTutorial";
import TeacherControls from "@/components/classroom/TeacherControls";
import WorldSituation from "@/components/classroom/WorldSituation";
import HelpPanel from "@/components/classroom/HelpPanel";
type Pending = { command: Command; requestId: string };
export default function DashboardClient({ roomCode }: { roomCode: string }) {
  const [view, setView] = useState<RoomView | null>(null),
    [error, setError] = useState(""),
    [connected, setConnected] = useState(false),
    [now, setNow] = useState(0),
    [offset, setOffset] = useState(0),
    [tab, setTab] = useState("decisions"),
    [action, setAction] = useState<ActionId | null>(null),
    [target, setTarget] = useState(""),
    [busy, setBusy] = useState(false),
    [pending, setPending] = useState<Pending | null>(null),
    [practice, setPractice] = useState(false),
    [forceBriefing, setForceBriefing] = useState(false),
    [selectedOffer, setSelectedOffer] = useState<string>(),
    [banner, setBanner] = useState<string[]>([]),
    [results, setResults] = useState<Event[] | null>(null),
    [projection, setProjection] = useState(false);
  const [lang, setLang] = usePreference<Lang>("1937-language", "dual"),
    [sound, setSound] = usePreference("1937-sound", false);
  const preferenceKey =
    (view?.gameId ?? roomCode) + ":" + (view?.country ?? "teacher");
  const [acknowledged, setAcknowledged, briefReady] = usePreference(
      "1937-briefing-v1:" + preferenceKey,
      false,
    ),
    [seen, setSeen, seenReady] = usePreference<string[]>(
      "1937-notified-v1:" + preferenceKey,
      [],
    ),
    [read, setRead] = usePreference<string[]>(
      "1937-read-v1:" + preferenceKey,
      [],
    );
  const audio = useRef<AudioContext | null>(null);
  const L = (en: string, ja: string) => text(lang, copy(en, ja));
  const refresh = useCallback(async () => {
    try {
      const next = await api<RoomView>({ op: "state", room: roomCode });
      setView(next);
      setNow(Date.now());
      setOffset(next.serverNow - Date.now());
      setConnected(true);
      return next.state.phase;
    } catch (e) {
      setConnected(false);
      setError(friendlyError(e, lang));
    }
  }, [roomCode, lang]);
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
  }, [refresh, view?.state.phase]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    Promise.resolve().then(() => {
      try {
        const saved = sessionStorage.getItem("pending_" + roomCode);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.command && typeof parsed.requestId === "string")
            setPending(parsed);
        }
      } catch {}
    });
  }, [roomCode]);
  const notices = useMemo(
    () => (view?.country ? getNotices(view.state, view.country, lang) : []),
    [view, lang],
  );
  useEffect(() => {
    if (!seenReady) return;
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      const fresh = notices.filter((n) => !seen.includes(n.id));
      if (fresh.length) {
        setBanner((old) =>
          Array.from(new Set([...old, ...fresh.map((n) => n.id)])),
        );
        setSeen([...seen, ...fresh.map((n) => n.id)]);
        if (sound && audio.current) {
          try {
            const oscillator = audio.current.createOscillator(),
              gain = audio.current.createGain();
            gain.gain.setValueAtTime(0.04, audio.current.currentTime);
            gain.gain.exponentialRampToValueAtTime(
              0.001,
              audio.current.currentTime + 0.18,
            );
            oscillator.frequency.value = 660;
            oscillator.connect(gain);
            gain.connect(audio.current.destination);
            oscillator.start();
            oscillator.stop(audio.current.currentTime + 0.2);
          } catch {}
        }
      }
    });
    return () => {
      active = false;
    };
  }, [notices, seen, seenReady, setSeen, sound]);
  async function send(command: Command, retryId?: string) {
    if (practice) {
      setError(
        L(
          "Close practice before making a real decision.",
          "本番の行動をするには練習を閉じてください。",
        ),
      );
      return;
    }
    if (pending && !retryId) {
      setError(
        L(
          "Resolve your pending request first.",
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
      const reply = await api<{ events?: Event[] }>({
        op: "command",
        room: roomCode,
        ...request,
      });
      setPending(null);
      sessionStorage.removeItem("pending_" + roomCode);
      setResults(reply.events ?? []);
    } catch (e) {
      if (e instanceof ServerError) {
        setPending(null);
        sessionStorage.removeItem("pending_" + roomCode);
      }
      setError(friendlyError(e, lang));
    } finally {
      await refresh();
      setBusy(false);
    }
  }
  function navigate(next: string) {
    setTab(next);
    requestAnimationFrame(() => {
      const panel = document.getElementById("main-workspace");
      panel?.focus({ preventScroll: true });
      panel?.scrollIntoView({ block: "start" });
    });
  }
  function openBriefing() {
    setForceBriefing(true);
    setTab("decisions");
    requestAnimationFrame(() =>
      document
        .getElementById("country-briefing")
        ?.scrollIntoView({ block: "start" }),
    );
  }
  function review(id: string, proposalId?: string) {
    setRead(Array.from(new Set([...read, id])));
    setTab(proposalId ? "diplomacy" : "world");
    setSelectedOffer(proposalId);
    setPractice(false);
    requestAnimationFrame(() => {
      document
        .getElementById(
          proposalId ? "dispatch-" + proposalId : "main-workspace",
        )
        ?.focus();
    });
  }
  if (!view)
    return (
      <main className="shell">
        <Link href="/">
          ← {L("Home and team joining", "ホーム・チームへの参加")}
        </Link>
        <section className="panel panel-body">
          <h1>{roomCode}</h1>
          <p role="status">
            {error || L("Opening your command room…", "作戦室に接続中…")}
          </p>
          <button onClick={refresh}>{L("Reconnect", "再接続")}</button>
        </section>
      </main>
    );
  const s = view.state,
    c = s.countries.find((c) => c.name === view.country),
    seconds = Math.ceil(
      s.phase === "PAUSED"
        ? s.remaining
        : s.deadline
          ? Math.max(0, (s.deadline - now - offset) / 1000)
          : 0,
    ),
    offers = s.proposals.filter(
      (p) => p.to === c?.name && p.status === "PENDING",
    );
  const visibleNotices = notices.filter((n) => banner.includes(n.id));
  const event = EVENT_DECK.find((e) => e.code === s.event);
  const needsBriefing = !!c && (!acknowledged || forceBriefing);
  const lastSummary = s.summaries.at(-1);
  const outcomeChanges = new Map<
    string,
    {
      country: string;
      before: NonNullable<Event["changes"]>[number]["before"];
      after: NonNullable<Event["changes"]>[number]["after"];
    }
  >();
  for (const e of results ?? [])
    for (const change of e.changes ?? []) {
      const old = outcomeChanges.get(change.country);
      outcomeChanges.set(change.country, {
        ...change,
        before: old?.before ?? change.before,
      });
    }
  return (
    <main className={"command-room " + (projection ? "projected" : "")}>
      <header className="command-header">
        <div>
          <Link href="/" className="brand">
            1937 <span>{L("COMMAND ROOM", "作戦室")}</span>
          </Link>
          <h1>{view.title}</h1>
          <p>
            {c
              ? countryName(c.name, lang)
              : L("Teacher workspace", "教員ワークスペース")}{" "}
            · {L("Round", "ラウンド")} {s.round} / {s.totalRounds} ·{" "}
            {text(lang, PHASE_NAMES[s.phase])}
          </p>
        </div>
        <div className="header-status">
          <div
            className={
              "timer " + (seconds < 30 && s.phase === "RUNNING" ? "urgent" : "")
            }
            aria-label={L("Time remaining", "残り時間")}
          >
            {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
          </div>
          <strong className="actions-remaining">
            {c
              ? L(
                  `${2 - c.used} team ${2 - c.used === 1 ? "action" : "actions"} remaining`,
                  `チームの残り行動 ${2 - c.used}回`,
                )
              : L("Classroom controls", "教室の進行")}
          </strong>
          {c && (
            <small>
              {L("Shared by all your teammates", "チーム全員で共有します")}
            </small>
          )}
          <button
            className={"inbox-button " + (offers.length ? "has-offers" : "")}
            onClick={() => {
              setTab("diplomacy");
              if (offers[0]) review("offer:" + offers[0].id, offers[0].id);
            }}
          >
            {L("Diplomatic dispatches", "外交の連絡")}{" "}
            <span className="badge">{offers.length}</span>{" "}
            {L("awaiting reply", "返答待ち")}
          </button>
        </div>
      </header>
      <div className="utility-bar">
        <nav aria-label={L("Language", "言語")}>
          {(["dual", "en", "ja"] as Lang[]).map((l) => (
            <button
              key={l}
              aria-pressed={lang === l}
              onClick={() => setLang(l)}
            >
              {l === "dual"
                ? "English / 日本語"
                : l === "en"
                  ? "English"
                  : "日本語"}
            </button>
          ))}
        </nav>
        <span className={connected ? "connected" : "error"} role="status">
          {connected
            ? L("Connected to your classroom", "教室に接続済み")
            : L(
                "Disconnected. Actions are paused on this device.",
                "切断中。この端末からは行動できません。",
              )}
        </span>
        <button onClick={refresh}>{L("Refresh", "更新")}</button>
        <button
          aria-pressed={sound}
          onClick={() => {
            if (!sound && typeof AudioContext !== "undefined") {
              audio.current ??= new AudioContext();
              void audio.current.resume();
            }
            setSound(!sound);
          }}
        >
          {sound ? L("Sound on", "通知音あり") : L("Sound off", "通知音なし")}
        </button>
        {view.teacher && (
          <button onClick={() => setProjection(!projection)}>
            {projection
              ? L("Leave projection view", "投影表示を終了")
              : L("Projection view", "投影表示")}
          </button>
        )}
      </div>
      {visibleNotices.length > 0 && (
        <aside
          className="notification-banner"
          aria-live="polite"
          aria-atomic="true"
        >
          <div>
            <strong>
              {L(
                `${visibleNotices.length} new ${visibleNotices.length === 1 ? "update" : "updates"}`,
                `新しい連絡 ${visibleNotices.length}件`,
              )}
            </strong>
            {visibleNotices.slice(0, 3).map((n) => (
              <p key={n.id}>
                {n.message}{" "}
                <button onClick={() => review(n.id, n.proposalId)}>
                  {n.kind === "offer"
                    ? L("Review offer", "提案を確認")
                    : L("Review update", "連絡を確認")}
                </button>
              </p>
            ))}
          </div>
          <button
            onClick={() => setBanner([])}
            aria-label={L("Dismiss notification banner", "通知バナーを閉じる")}
          >
            {L("Dismiss", "閉じる")}
          </button>
        </aside>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
          <button onClick={() => setError("")}>{L("Dismiss", "閉じる")}</button>
        </p>
      )}
      {pending && (
        <aside className="notice">
          <p>
            {L(
              "Your request is awaiting confirmation. A retry will never spend your action twice.",
              "操作の結果を確認中です。再試行しても行動を二重に消費しません。",
            )}
          </p>
          <button
            disabled={busy || !connected}
            onClick={() => send(pending.command, pending.requestId)}
          >
            {L("Retry pending request", "保留中の操作を再試行")}
          </button>
        </aside>
      )}
      {s.phase === "LOBBY" && (
        <aside className="phase-banner">
          <strong>
            {L(
              "Gather your team and read your country card.",
              "チームで集まり、国のカードを読みましょう。",
            )}
          </strong>
          <p>
            {L(
              "At least two countries must join. Your teacher will start the first round. Countries with no team will not take part.",
              "2か国以上が必要です。教員が最初のラウンドを始めます。未参加の国はゲームに入りません。",
            )}{" "}
            {L("Room code", "ルームコード")}: <strong>{roomCode}</strong>
          </p>
        </aside>
      )}
      {["BETWEEN_ROUNDS", "FINISHED", "ARCHIVED"].includes(s.phase) && (
        <aside className="phase-banner">
          <h2>
            {s.phase === "BETWEEN_ROUNDS"
              ? L("Time to discuss the round", "ラウンドを振り返りましょう")
              : L("Final results", "最終結果")}
          </h2>
          <p>
            {L(
              "Actions are closed. Review the victory points and discuss your choices.",
              "行動の受付は終了しました。勝利点と選択を振り返りましょう。",
            )}
          </p>
          {c && lastSummary && (
            <strong>
              {L("Your country earned", "このラウンドの獲得点：")}{" "}
              {lastSummary.scores[c.name]}{" "}
              {L("victory points this round.", "勝利点")}
            </strong>
          )}
        </aside>
      )}
      {event && (
        <aside className="event-ribbon">
          <span className="eyebrow">
            {L("This round’s world event", "今回の世界の出来事")}
          </span>
          <strong>{text(lang, copy(event.name_en, event.name_ja))}</strong>
          <p>{text(lang, readable(copy(event.desc_en, event.desc_ja)))}</p>
        </aside>
      )}
      <nav
        className="room-navigation"
        aria-label={L("Classroom navigation", "教室のナビゲーション")}
      >
        {[
          ["decisions", copy("Your decisions", "今回の行動")],
          ["diplomacy", copy("Diplomacy", "外交")],
          ["world", copy("World situation", "世界の状況")],
          ["help", copy("Help and practice", "ヘルプ・練習")],
          ...(view.teacher && !projection
            ? [["teacher", copy("Teacher controls", "教員の操作")]]
            : []),
        ].map(([key, label]) => (
          <button
            key={key as string}
            aria-pressed={tab === key}
            onClick={() => navigate(key as string)}
          >
            {text(lang, label as { en: string; ja: string })}
            {key === "diplomacy" && offers.length > 0 && (
              <span className="badge">{offers.length}</span>
            )}
          </button>
        ))}
      </nav>
      {practice && (
        <PracticeTutorial
          lang={lang}
          country={c?.name}
          live={s.phase === "RUNNING"}
          onClose={() => setPractice(false)}
        />
      )}
      {c && needsBriefing && tab !== "diplomacy" && !projection ? (
        <div
          id="country-briefing"
          className="briefing-stage"
          inert={practice || undefined}
        >
          {briefReady ? (
            <CountryDossier
              country={c}
              state={s}
              lang={lang}
              briefing
              onPractice={() => setPractice(true)}
              onReady={() => {
                setAcknowledged(true);
                setForceBriefing(false);
                requestAnimationFrame(() =>
                  document
                    .getElementById("main-workspace")
                    ?.scrollIntoView({ block: "start" }),
                );
              }}
            />
          ) : (
            <p>
              {L("Opening your country briefing…", "国の概要を開いています…")}
            </p>
          )}
        </div>
      ) : (
        <div
          className={"command-layout " + (!c || projection ? "no-dossier" : "")}
          inert={practice || undefined}
        >
          {c && !projection && (
            <aside className="country-sidebar">
              <CountryDossier
                country={c}
                state={s}
                lang={lang}
                onPractice={() => setPractice(true)}
              />
              <button onClick={openBriefing}>
                {L("Read the full country briefing", "国の概要をもう一度読む")}
              </button>
            </aside>
          )}
          <section id="main-workspace" tabIndex={-1} className="main-workspace">
            {tab === "decisions" && !projection && (
              <>
                {results && (
                  <section className="result-panel panel" role="status">
                    <div className="panel-body">
                      <div className="section-heading">
                        <h2>
                          {outcomeChanges.size
                            ? L("Here is what changed", "変化したこと")
                            : L(
                                "Your proposal has been sent",
                                "提案を送りました",
                              )}
                        </h2>
                        <button onClick={() => setResults(null)}>
                          {L("Dismiss result", "結果を閉じる")}
                        </button>
                      </div>
                      {!outcomeChanges.size && (
                        <p>
                          {L(
                            "Sending did not spend actions or resources. Wait for the other team to reply.",
                            "送信時は行動や資源を消費しません。相手の返答を待ちましょう。",
                          )}
                        </p>
                      )}
                      {Array.from(outcomeChanges.values()).map((change) => (
                        <div key={change.country}>
                          <h3>{countryName(change.country, lang)}</h3>
                          <div className="result-changes">
                            {(Object.keys(RESOURCE_INFO) as Resource[])
                              .filter(
                                (r) => change.before[r] !== change.after[r],
                              )
                              .map((r) => (
                                <p
                                  key={r}
                                  className={
                                    change.after[r] > change.before[r]
                                      ? "gain"
                                      : "loss"
                                  }
                                >
                                  {text(lang, RESOURCE_INFO[r])}:{" "}
                                  {change.before[r]} →{" "}
                                  <strong>{change.after[r]}</strong>
                                </p>
                              ))}
                          </div>
                          {change.before.master !== change.after.master && (
                            <p>
                              {change.after.master
                                ? L("Now occupied", "占領されました")
                                : L("Independent again", "再び独立しました")}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                {c ? (
                  <>
                    <div className="section-heading">
                      <div>
                        <p className="eyebrow">
                          {L(
                            "YOUR DECISIONS THIS ROUND",
                            "今回のラウンドの行動",
                          )}
                        </p>
                        <h2>
                          {L(
                            "What will your country do?",
                            "自国は何をしますか？",
                          )}
                        </h2>
                        <p>
                          {L(
                            "Choose a card. Read the cost and possible result. Then confirm your decision.",
                            "カードを選び、消費と結果を確認してから実行します。",
                          )}
                        </p>
                      </div>
                    </div>
                    {action && (
                      <ActionReview
                        state={s}
                        country={c}
                        lang={lang}
                        action={action}
                        target={target}
                        onTarget={setTarget}
                        onClose={() => setAction(null)}
                        onSend={send}
                        busy={
                          busy ||
                          !!pending ||
                          !connected ||
                          (s.phase === "RUNNING" && seconds === 0)
                        }
                      />
                    )}
                    <ActionCards
                      state={s}
                      country={c}
                      lang={lang}
                      disabled={
                        busy ||
                        !!pending ||
                        !connected ||
                        (s.phase === "RUNNING" && seconds === 0)
                      }
                      onChoose={(id) => {
                        setAction(id);
                        requestAnimationFrame(() =>
                          document.getElementById("action-review")?.focus(),
                        );
                      }}
                    />
                  </>
                ) : (
                  <section className="panel panel-body">
                    <h2>{L("Your classroom command room", "教室の作戦室")}</h2>
                    <p>
                      {L(
                        "Use Teacher controls to begin the round, manage teams, and support the class.",
                        "教員の操作でラウンドを始め、チームと授業を管理できます。",
                      )}
                    </p>
                  </section>
                )}
              </>
            )}
            {tab === "diplomacy" && !projection && (
              <DispatchCenter
                state={s}
                country={c}
                lang={lang}
                onSend={send}
                busy={
                  busy ||
                  !!pending ||
                  !connected ||
                  (s.phase === "RUNNING" && seconds === 0)
                }
                selected={selectedOffer}
                read={read}
                onRead={(id) => setRead(Array.from(new Set([...read, id])))}
              />
            )}
            {(tab === "world" || projection) && (
              <WorldSituation state={s} lang={lang} />
            )}{" "}
            {tab === "help" && !projection && (
              <HelpPanel
                lang={lang}
                onPractice={() => setPractice(true)}
                onBriefing={() => {
                  setForceBriefing(true);
                  setTab("decisions");
                }}
              />
            )}
            {tab === "teacher" && view.teacher && !projection && (
              <TeacherControls
                view={view}
                lang={lang}
                send={send}
                busy={busy}
                refresh={refresh}
              />
            )}
          </section>
        </div>
      )}
    </main>
  );
}
