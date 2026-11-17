import Image from "next/image";
import { text, copy, type Lang } from "@/lib/presentation";
export default function MissionIntro({
  lang,
  onPractice,
}: {
  lang: Lang;
  onPractice: () => void;
}) {
  const L = (en: string, ja: string) => text(lang, copy(en, ja));
  return (
    <section className="mission panel">
      <Image
        src="/art/diplomacy.webp"
        alt={L(
          "Diplomats discussing an agreement in a historical conference room",
          "歴史的な会議室で合意について話し合う外交官",
        )}
        width={960}
        height={640}
        priority
      />
      <div className="mission-copy">
        <p className="eyebrow">1937 · {L("Your mission", "あなたの任務")}</p>
        <h1>
          {L(
            "Lead your country. Shape the next round.",
            "国を導き、次のラウンドを動かす。",
          )}
        </h1>
        <p>
          {L(
            "You and your teammates lead one country. Talk to other teams, make decisions, and earn victory points.",
            "チームで1つの国を担当します。他のチームと話し合い、行動を決め、勝利点を獲得しましょう。",
          )}
        </p>
        <ol className="mission-steps">
          <li>
            {L(
              "Read your country’s goals. Different countries earn bonus points in different ways.",
              "国の目標を読む。国によって追加点の条件が異なります。",
            )}
          </li>
          <li>
            {L(
              "Negotiate face to face. Trade and alliances need both teams to agree.",
              "対面で交渉する。貿易と同盟には双方の合意が必要です。",
            )}
          </li>
          <li>
            {L(
              "Choose up to two team actions each round. Your devices share the same allowance.",
              "各ラウンドでチームとして2行動まで。複数の端末でも共有です。",
            )}
          </li>
          <li>
            {L(
              "Your teacher starts and closes rounds. The highest victory-point total wins.",
              "教員がラウンドを進行します。最後に勝利点が最も多い国が勝ちます。",
            )}
          </li>
        </ol>
        <div className="controls">
          <a className="button primary" href="#join-classroom">
            {L("Choose your country", "担当する国を選ぶ")}
          </a>
          <button onClick={onPractice}>
            {L("Try the 2-minute practice", "2分間の練習を試す")}
          </button>
        </div>
      </div>
    </section>
  );
}
