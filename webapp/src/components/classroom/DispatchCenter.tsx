import {
  text,
  copy,
  countryName,
  costText,
  unavailable,
  type Lang,
} from "@/lib/presentation";
import type { State, Country, Command } from "@/lib/classroom";
export default function DispatchCenter({
  state: s,
  country: c,
  lang,
  onSend,
  busy,
  selected,
  read,
  onRead,
}: {
  state: State;
  country?: Country;
  lang: Lang;
  onSend: (c: Command) => void;
  busy: boolean;
  selected?: string;
  read: string[];
  onRead: (id: string) => void;
}) {
  const L = (en: string, ja: string) => text(lang, copy(en, ja)),
    statuses = {
      PENDING: copy("Waiting for a reply", "返答待ち"),
      ACCEPTED: copy("Accepted", "承認済み"),
      DECLINED: copy("Declined", "拒否済み"),
      CANCELLED: copy("Cancelled", "取消済み"),
      EXPIRED: copy("Expired at round end", "ラウンド終了で期限切れ"),
    };
  return (
    <section className="panel">
      <div className="panel-body">
        <h2>{L("Diplomatic dispatches", "外交の連絡")}</h2>
        <p>
          {L(
            "Talk face to face, then record your agreement here. Read the costs for both teams before accepting.",
            "対面で話し合い、ここで合意を記録します。承認前に双方の消費を確認しましょう。",
          )}
        </p>
        {!s.proposals.length && (
          <p>
            {L(
              "No proposals yet. Offer trade or an alliance from your decision cards.",
              "提案はまだありません。行動カードから貿易や同盟を提案できます。",
            )}
          </p>
        )}
        {s.proposals
          .slice()
          .reverse()
          .map((p) => {
            const from = s.countries.find((c) => c.name === p.from)!,
              to = s.countries.find((c) => c.name === p.to)!,
              incoming = p.to === c?.name,
              reason =
                (unavailable(s, from, p.kind, lang, to)
                  ? countryName(from.name, lang) +
                    ": " +
                    unavailable(s, from, p.kind, lang, to)
                  : "") ||
                (unavailable(s, to, p.kind, lang, from)
                  ? countryName(to.name, lang) +
                    ": " +
                    unavailable(s, to, p.kind, lang, from)
                  : "");
            return (
              <article
                className={"dispatch " + (selected === p.id ? "highlight" : "")}
                tabIndex={-1}
                id={"dispatch-" + p.id}
                key={p.id}
              >
                <span className="eyebrow">
                  {text(lang, statuses[p.status])}
                  {incoming && !read.includes("offer:" + p.id)
                    ? " · " + L("New", "新着")
                    : ""}
                </span>
                <h3>
                  {countryName(p.from, lang)} → {countryName(p.to, lang)}
                </h3>
                <p>
                  {p.kind === "TRADE"
                    ? L("Trade agreement", "貿易の合意")
                    : L("Alliance", "同盟")}
                </p>
                <p>{costText(p.kind, from, lang, to)}</p>
                <p>
                  {p.kind === "TRADE"
                    ? L("Both gain 1 economy.", "双方が経済力1を獲得します。")
                    : L(
                        "Both gain 1 political power and become allies. Each ally adds 2 battle support, up to a total of 4.",
                        "双方が政治力1を獲得し、同盟国になります。同盟1国につき2、最大4の援軍を得られます。",
                      )}
                </p>
                {incoming && (
                  <button onClick={() => onRead("offer:" + p.id)}>
                    {read.includes("offer:" + p.id)
                      ? L("Read", "確認済み")
                      : L("Mark as read", "確認済みにする")}
                  </button>
                )}
                {p.status === "PENDING" && incoming && (
                  <>
                    <p className="availability">{reason}</p>
                    <div className="controls">
                      <button
                        className="primary"
                        disabled={busy || !!reason}
                        onClick={() => {
                          onRead("offer:" + p.id);
                          onSend({ type: "ACCEPT", proposalId: p.id });
                        }}
                      >
                        {L("Accept this agreement", "この合意を承認")}
                      </button>
                      <button
                        disabled={busy || s.phase !== "RUNNING"}
                        onClick={() =>
                          onSend({ type: "DECLINE", proposalId: p.id })
                        }
                      >
                        {L("Decline", "拒否する")}
                      </button>
                    </div>
                  </>
                )}
                {p.status === "PENDING" && p.from === c?.name && (
                  <button
                    disabled={busy || s.phase !== "RUNNING"}
                    onClick={() => onSend({ type: "CANCEL", proposalId: p.id })}
                  >
                    {L("Cancel your proposal", "自分の提案を取り消す")}
                  </button>
                )}
              </article>
            );
          })}
      </div>
    </section>
  );
}
