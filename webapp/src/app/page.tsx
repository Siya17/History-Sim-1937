"use client";
import { useEffect, useState } from "react";
import { INITIAL_COUNTRIES } from "@/lib/gameEngine";
import Link from "next/link";
import { usePreference } from "@/lib/preferences";
import { useRouter } from "next/navigation";
import MissionIntro from "@/components/classroom/MissionIntro";
import PracticeTutorial from "@/components/classroom/PracticeTutorial";
import { countryName, type Lang } from "@/lib/presentation";
import { PHASE_NAMES } from "@/lib/classroom";
import { api } from "@/lib/client";
type Saved = { room: string; title: string; phase: string };
export default function Home() {
  const router = useRouter();
  const [teacher, setTeacher] = useState(false),
    [games, setGames] = useState<Saved[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [recovery, setRecovery] = useState<{ room: string; code: string } | null>(
      null,
    ),
    [lang, setLang] = usePreference<Lang>("1937-language", "dual"),
    [practice, setPractice] = useState(false),
    [joinRoom, setJoinRoom] = useState("");
  const L = (en: string, ja: string) =>
    lang === "en" ? en : lang === "ja" ? ja : `${en} / ${ja}`;
  async function load() {
    const me = await api<{ teacher: unknown }>({ op: "me" });
    setTeacher(!!me.teacher);
    if (me.teacher)
      setGames((await api<{ games: Saved[] }>({ op: "list" })).games);
  }
  useEffect(() => {
    api<{ teacher: unknown }>({ op: "me" })
      .then(async (me) => {
        setJoinRoom(new URLSearchParams(location.search).get("room") ?? "");
        setTeacher(!!me.teacher);
        if (me.teacher)
          setGames((await api<{ games: Saved[] }>({ op: "list" })).games);
      })
      .catch((e) => setError(e.message));
  }, []);
  async function submit(event: React.FormEvent<HTMLFormElement>, op: string) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(event.currentTarget);
    const values = Object.fromEntries(f);
    try {
      if (op === "login") {
        const response = await fetch("/api/auth/sign-in/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        if (!response.ok)
          throw new Error(
            "Incorrect email or password / ログイン情報を確認してください",
          );
        await load();
      } else {
        const result = await api<{ room: string; code?: string }>({
          op,
          ...values,
          ...(op === "create" && !values.room ? { room: undefined } : {}),
          ...(op === "create"
            ? {
                rounds: Number(values.rounds),
                duration: Number(values.duration),
              }
            : {}),
        });
        if (result.code) setRecovery({ room: result.room, code: result.code });
        else router.push("/dashboard/" + result.room);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="shell">
      <header className="mast">
        <Link href="/" className="brand">
          1937 <span>CLASSROOM</span>
        </Link>
        <nav aria-label="Language">
          {["dual", "en", "ja"].map((l) => (
            <button
              key={l}
              aria-pressed={lang === l}
              onClick={() => setLang(l as Lang)}
            >
              {l === "dual" ? "EN / 日本語" : l === "en" ? "English" : "日本語"}
            </button>
          ))}
        </nav>
      </header>
      <MissionIntro lang={lang} onPractice={() => setPractice(true)} />
      {practice && (
        <PracticeTutorial lang={lang} onClose={() => setPractice(false)} />
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {recovery && (
        <section className="card notice">
          <h2>{L("Save your team rejoin code", "チーム再参加コードを保存")}</h2>
          <p>
            {L(
              "Share this only with your teammates. It allows another device to control your country.",
              "チームのメンバーだけに共有してください。他の端末から自国を操作できます。",
            )}
          </p>
          <strong className="code">{recovery.code}</strong>
          <button onClick={() => navigator.clipboard.writeText(recovery.code)}>
            {L("Copy code", "コピー")}
          </button>
          <a className="button" href={"/dashboard/" + recovery.room}>
            {L("Enter classroom", "ゲームへ進む")}
          </a>
        </section>
      )}
      <div className="grid two" inert={practice || undefined}>
        <section className="card" id="join-classroom">
          <h2>{L("Join a classroom", "授業に参加")}</h2>
          <form onSubmit={(e) => submit(e, "join")}>
            <label>
              {L("Room code", "ルームコード")}
              <input
                name="room"
                value={joinRoom}
                onChange={(e) => setJoinRoom(e.target.value)}
                required
                minLength={3}
                maxLength={20}
                placeholder="HIST101"
                autoCapitalize="characters"
              />
            </label>
            <label>
              {L("Team name", "チーム名")}
              <input name="name" required maxLength={60} />
            </label>
            <label>
              {L("Country", "担当国")}
              <select name="country">
                {INITIAL_COUNTRIES.map((c) => (
                  <option key={c.name_en} value={c.name_en}>
                    {countryName(c.name_en, lang)}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary" disabled={busy}>
              {L("Claim country and join", "国を選んで参加")}
            </button>
          </form>
          <details>
            <summary>
              {L("Rejoin or add a team device", "再参加・端末を追加")}
            </summary>
            <form onSubmit={(e) => submit(e, "recover")}>
              <label>
                {L("Room code", "ルームコード")}
                <input name="room" required />
              </label>
              <label>
                {L("Country", "担当国")}
                <select name="country">
                  {INITIAL_COUNTRIES.map((c) => (
                    <option key={c.name_en} value={c.name_en}>
                      {countryName(c.name_en, lang)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {L("Team rejoin code", "チーム再参加コード")}
                <input name="code" required autoComplete="off" />
              </label>
              <button disabled={busy}>
                {L("Rejoin team", "チームに再参加")}
              </button>
            </form>
          </details>
        </section>
        <section className="card">
          <h2>{L("Teacher workspace", "教員ワークスペース")}</h2>
          {teacher ? (
            <>
              <form onSubmit={(e) => submit(e, "create")}>
                <label>
                  {L("Game title", "ゲーム名")}
                  <input
                    name="title"
                    required
                    defaultValue="1937 Classroom"
                    maxLength={100}
                  />
                </label>
                <label>
                  {L("Room code (optional)", "ルームコード（任意）")}
                  <input
                    name="room"
                    pattern="[A-Za-z0-9-]{3,20}"
                    placeholder="Auto-generated / 自動生成"
                  />
                </label>
                <div className="grid two">
                  <label>
                    {L("Rounds", "ラウンド数")}
                    <input
                      name="rounds"
                      type="number"
                      min={1}
                      max={12}
                      defaultValue={9}
                    />
                  </label>
                  <label>
                    {L("Seconds per round", "1ラウンドの秒数")}
                    <input
                      name="duration"
                      type="number"
                      min={60}
                      max={900}
                      defaultValue={420}
                    />
                  </label>
                </div>
                <button disabled={busy} className="primary">
                  {L("Create classroom", "ルームを作成")}
                </button>
              </form>
              <details>
                <summary>{L("Change password", "パスワード変更")}</summary>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setError("");
                    const f = new FormData(e.currentTarget);
                    const r = await fetch("/api/auth/change-password", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        currentPassword: f.get("current"),
                        newPassword: f.get("next"),
                        revokeOtherSessions: true,
                      }),
                    });
                    if (!r.ok)
                      setError(
                        L("Password change failed", "パスワード変更失敗"),
                      );
                    else
                      alert(L("Password updated", "パスワードを更新しました"));
                  }}
                >
                  <label>
                    {L("Current password", "現在のパスワード")}
                    <input
                      name="current"
                      type="password"
                      autoComplete="current-password"
                      required
                    />
                  </label>
                  <label>
                    {L(
                      "New password (12+ characters)",
                      "新しいパスワード（12文字以上）",
                    )}
                    <input
                      name="next"
                      type="password"
                      autoComplete="new-password"
                      minLength={12}
                      required
                    />
                  </label>
                  <button>{L("Update password", "更新")}</button>
                </form>
              </details>
              <h3>{L("Saved games", "保存したゲーム")}</h3>
              {games.length ? (
                games.map((g) => (
                  <a
                    className="saved"
                    key={g.room}
                    href={"/dashboard/" + g.room}
                  >
                    <span>
                      {g.title}
                      <small>{g.room}</small>
                    </span>
                    <span className="pill">
                      {L(PHASE_NAMES[g.phase].en, PHASE_NAMES[g.phase].ja)}
                    </span>
                  </a>
                ))
              ) : (
                <p>
                  {L(
                    "Your first classroom starts here.",
                    "最初のルームを作成しましょう。",
                  )}
                </p>
              )}
              <button
                onClick={async () => {
                  await fetch("/api/auth/sign-out", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: "{}",
                  });
                  location.reload();
                }}
              >
                {L("Sign out", "ログアウト")}
              </button>
            </>
          ) : (
            <>
              <p>
                {L(
                  "Sign in to create and manage your classes. Students do not need accounts.",
                  "ログインして授業を管理できます。学生のアカウントは不要です。",
                )}
              </p>
              <form onSubmit={(e) => submit(e, "login")}>
                <label>
                  Email
                  <input
                    name="email"
                    type="email"
                    autoComplete="username"
                    required
                  />
                </label>
                <label>
                  {L("Password", "パスワード")}
                  <input
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </label>
                <button className="primary" disabled={busy}>
                  {L("Teacher sign in", "教員ログイン")}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
      <footer>
        {L(
          "1937 is a simplified classroom simulation. Country labels and mechanics are teaching abstractions.",
          "本作は授業用に簡略化したシミュレーションです。国家分類やルールは学習のための抽象化です。",
        )}
      </footer>
    </main>
  );
}
