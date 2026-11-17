import type { State } from "./classroom";
import { copy, countryName, text, type Lang } from "./presentation";
export type Notice = {
  id: string;
  message: string;
  proposalId?: string;
  kind: "offer" | "event";
};
export function getNotices(s: State, country: string, lang: Lang): Notice[] {
  const offers = s.proposals
    .filter((p) => p.to === country && p.status === "PENDING")
    .map((p) => ({
      id: "offer:" + p.id,
      proposalId: p.id,
      kind: "offer" as const,
      message:
        countryName(p.from, lang) +
        " " +
        text(
          lang,
          p.kind === "ALLIANCE"
            ? copy("proposes an alliance.", "が同盟を提案しています。")
            : copy("proposes a trade agreement.", "が貿易を提案しています。"),
        ),
    }));
  const replies: Notice[] = s.proposals
    .filter(
      (p) =>
        p.from === country &&
        p.round === s.round &&
        ["ACCEPTED", "DECLINED"].includes(p.status),
    )
    .map((p) => ({
      id: "reply:" + p.id + ":" + p.status,
      proposalId: p.id,
      kind: "event",
      message:
        countryName(p.to, lang) +
        " " +
        text(
          lang,
          p.status === "ACCEPTED"
            ? copy("accepted your proposal.", "が提案を承認しました。")
            : copy("declined your proposal.", "が提案を拒否しました。"),
        ),
    }));
  const events = s.events
    .filter((e) => e.round === s.round)
    .flatMap((e) => {
      const change = e.changes?.find((c) => c.country === country);
      if (e.category === "ROUND")
        return [
          {
            id: "event:" + e.sequence,
            kind: "event" as const,
            message: text(
              lang,
              copy(
                "The round has closed. Review your victory points.",
                "ラウンドが終了しました。勝利点を確認しましょう。",
              ),
            ),
          },
        ];
      if (change?.before.master !== change?.after.master && change)
        return [
          {
            id:
              "status:" +
              e.round +
              ":" +
              e.at +
              ":" +
              (change.after.master ?? "independent"),
            kind: "event" as const,
            message: change.after.master
              ? text(
                  lang,
                  copy(
                    "Your country is now occupied. You can rebuild and resist.",
                    "自国が占領されました。復興と抵抗で独立を目指せます。",
                  ),
                )
              : text(
                  lang,
                  copy(
                    "Your country is independent again.",
                    "自国が再び独立しました。",
                  ),
                ),
          },
        ];
      if (e.category === "WAR" && e.command?.target === country)
        return [
          {
            id: "event:" + e.sequence,
            kind: "event" as const,
            message: text(
              lang,
              copy(
                "Another country attacked you. Review the battle result.",
                "他国が自国を攻撃しました。戦闘の結果を確認しましょう。",
              ),
            ),
          },
        ];
      return [];
    });
  return Array.from(
    new Map([...offers, ...replies, ...events].map((n) => [n.id, n])).values(),
  );
}
