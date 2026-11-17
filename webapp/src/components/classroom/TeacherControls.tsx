"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { api } from "@/lib/client";
import {
  RESOURCE_INFO,
  countryName,
  text,
  copy,
  type Lang,
  type Resource,
} from "@/lib/presentation";
import type { RoomView, Send } from "@/lib/view";
export default function TeacherControls({
  view,
  lang,
  send,
  busy,
  refresh,
}: {
  view: RoomView;
  lang: Lang;
  send: Send;
  busy: boolean;
  refresh: () => Promise<unknown>;
}) {
  const router = useRouter();
  const [secret, setSecret] = useState(""),
    [error, setError] = useState(""),
    [qr, setQr] = useState("");
  const L = (en: string, ja: string) => text(lang, copy(en, ja)),
    s = view.state;
  async function roster(op: string, country: string) {
    if (
      !confirm(
        L(
          "Change access for this team?",
          "このチームのアクセス権を変更しますか？",
        ),
      )
    )
      return;
    try {
      const result = await api<{ code?: string }>({
        op,
        room: view.room,
        country,
      });
      if (result.code)
        setSecret(countryName(country, lang) + ": " + result.code);
      await refresh();
    } catch {
      setError(
        L(
          "The access change could not be completed. Please try again.",
          "アクセス権を変更できませんでした。再試行してください。",
        ),
      );
    }
  }
  async function download(csv = false) {
    try {
      const data = await api<{ export: unknown }>({
        op: "export",
        room: view.room,
      });
      const rows = [
        [
          "Country",
          ...Object.values(RESOURCE_INFO).map((r) => r.en),
          "Occupier",
        ],
        ...s.countries.map((c) => [
          countryName(c.name, "en"),
          c.econ,
          c.mil,
          c.pol,
          c.dip,
          c.vp,
          c.master ?? "",
        ]),
      ];
      const content = csv
        ? "\uFEFF" +
          rows
            .map((row) =>
              row
                .map((v) => '"' + String(v).replaceAll('"', '""') + '"')
                .join(","),
            )
            .join("\r\n")
        : JSON.stringify(data.export, null, 2);
      const url = URL.createObjectURL(
        new Blob([content], {
          type: csv ? "text/csv;charset=utf-8" : "application/json",
        }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = view.room + (csv ? ".csv" : ".json");
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError(
        L(
          "Export failed. Try again.",
          "出力できませんでした。再試行してください。",
        ),
      );
    }
  }
  return (
    <section className="panel">
      <div className="panel-body">
        <h2>{L("Teacher controls", "教員の操作")}</h2>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="controls">
          {["LOBBY", "BETWEEN_ROUNDS"].includes(s.phase) && (
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
              {L("Pause round", "一時停止")}
            </button>
          )}
          {s.phase === "PAUSED" && (
            <button onClick={() => send({ type: "RESUME" })}>
              {L("Resume round", "再開")}
            </button>
          )}
          {["RUNNING", "PAUSED"].includes(s.phase) && (
            <button
              onClick={() => {
                if (
                  confirm(
                    L(
                      "Close and score this round now?",
                      "ラウンドを終了して採点しますか？",
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
                : L("Close joining", "参加受付を締切")}
            </button>
          )}
          {["FINISHED", "LOBBY"].includes(s.phase) && (
            <button onClick={() => send({ type: "ARCHIVE" })}>
              {L("Archive game", "アーカイブ")}
            </button>
          )}
          <button onClick={() => download()}>
            {L("Download game record", "ゲーム記録をダウンロード")}
          </button>
          <button onClick={() => download(true)}>
            {L("Download score table", "得点表をダウンロード")}
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
              } catch {
                setError(
                  L(
                    "Could not create a rematch.",
                    "再戦用ルームを作成できませんでした。",
                  ),
                );
              }
            }}
          >
            {L("Create rematch", "再戦用ルームを作成")}
          </button>
          <button
            onClick={async () => {
              const QR = await import("qrcode");
              setQr(
                await QR.toDataURL(location.origin + "/?room=" + view.room),
              );
            }}
          >
            {L("Show joining code", "参加用QRを表示")}
          </button>
        </div>
        {qr && (
          <Image
            src={qr}
            alt={L("Classroom joining code", "参加用QRコード")}
            width={220}
            height={220}
            unoptimized
          />
        )}
        <p>
          {L("Room code", "ルームコード")}: <strong>{view.room}</strong>
        </p>
        {secret && (
          <aside className="notice">
            <p>
              {L(
                "Share this only with the team. Their old devices have been signed out.",
                "対象チームだけに共有してください。古い端末はログアウトしました。",
              )}
            </p>
            <strong className="code">{secret}</strong>
            <button onClick={() => setSecret("")}>
              {L("Hide code", "コードを閉じる")}
            </button>
          </aside>
        )}
        <h3>{L("Class roster", "参加チーム")}</h3>
        {view.teams.map((t) => (
          <article className="dispatch" key={t.country}>
            <strong>
              {countryName(t.country, lang)} · {t.name}
            </strong>
            <div className="controls">
              <button onClick={() => roster("rotate", t.country)}>
                {L("Reset team code", "チームコードを更新")}
              </button>
              <button onClick={() => roster("revoke", t.country)}>
                {L("Sign out team devices", "チームの端末を解除")}
              </button>
              {s.phase === "LOBBY" && (
                <button onClick={() => roster("remove", t.country)}>
                  {L("Remove team", "チームを削除")}
                </button>
              )}
            </div>
          </article>
        ))}
        <h3>{L("Adjust resources or victory points", "資源・勝利点の調整")}</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            send({
              type: "ADJUST",
              target: String(f.get("country")),
              resource: String(f.get("resource")),
              delta: Number(f.get("delta")),
              reason: String(f.get("reason")),
            });
          }}
        >
          <label>
            {L("Country", "国")}
            <select name="country">
              {s.countries.map((c) => (
                <option key={c.name} value={c.name}>
                  {countryName(c.name, lang)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {L("Resource or score", "資源または得点")}
            <select name="resource">
              {(Object.keys(RESOURCE_INFO) as Resource[]).map((r) => (
                <option key={r} value={r}>
                  {text(lang, RESOURCE_INFO[r])}
                </option>
              ))}
            </select>
          </label>
          <label>
            {L("Amount to add or subtract", "増減させる数値")}
            <input
              name="delta"
              type="number"
              min={-15}
              max={15}
              defaultValue={1}
            />
          </label>
          <label>
            {L("Reason", "理由")}
            <input name="reason" required maxLength={300} />
          </label>
          <button disabled={busy || ["FINISHED", "ARCHIVED"].includes(s.phase)}>
            {L("Apply adjustment", "調整を適用")}
          </button>
        </form>
        {["FINISHED", "ARCHIVED", "LOBBY"].includes(s.phase) && (
          <button
            className="danger"
            onClick={async () => {
              if (
                prompt(
                  L(
                    "Type the room code to permanently delete this game",
                    "完全削除するにはルームコードを入力",
                  ),
                ) !== view.room
              )
                return;
              try {
                await api({ op: "delete", room: view.room });
                router.push("/");
              } catch {
                setError(L("Deletion failed.", "削除できませんでした。"));
              }
            }}
          >
            {L("Delete this game permanently", "ゲームを完全に削除")}
          </button>
        )}
      </div>
    </section>
  );
}
