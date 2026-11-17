"use client";
import { useEffect, useRef, useState } from "react";
import {
  createPractice,
  practiceBuild,
  practiceOffer,
  practiceAccept,
  practiceFinish,
} from "@/lib/practice";
import {
  ACTIONS,
  goals,
  text,
  copy,
  countryName,
  costText,
  type Lang,
} from "@/lib/presentation";
import ResourceDisplay from "./ResourceDisplay";
export default function PracticeTutorial({
  lang,
  country = "UK",
  live = false,
  onClose,
}: {
  lang: Lang;
  country?: string;
  live?: boolean;
  onClose: () => void;
}) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    return () => {
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);
  const [demo, setDemo] = useState(() => createPractice(country)),
    [step, setStep] = useState(0);
  const c = demo.state.countries.find((c) => c.name === demo.name)!,
    goal = goals(c),
    action = ACTIONS.find((a) => a.id === goal.practice)!,
    L = (en: string, ja: string) => text(lang, copy(en, ja));
  return (
    <section
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      ref={panel}
      tabIndex={-1}
      className="practice-panel panel"
      aria-label={L("Practice tutorial", "練習チュートリアル")}
    >
      <div className="panel-body">
        <div className="section-heading">
          <span className="eyebrow">
            {L("Practice only · about 2 minutes", "練習専用・約2分")}
          </span>
          <button onClick={onClose}>
            {L("Close practice", "練習を閉じる")}
          </button>
        </div>
        <p className="notice">
          {L(
            "This practice never changes your real country or spends your real actions.",
            "この練習で実際の国の資源や行動を消費することはありません。",
          )}
          {live &&
            " " +
              L(
                "Your classroom timer keeps running.",
                "教室のタイマーは進み続けます。",
              )}
        </p>
        <p>
          {L("Step", "ステップ")} {Math.min(step + 1, 4)} / 4 ·{" "}
          {countryName(c.name, lang)}
        </p>
        <ResourceDisplay country={c} lang={lang} />
        {step === 0 && (
          <>
            <h2>{L("1. Find your country’s goal", "1. 国の目標を見つける")}</h2>
            <p>{text(lang, goal.primary)}</p>
            <p>
              {L(
                "These resources help you reach that goal. Victory points are your score.",
                "資源は目標の達成に役立ちます。勝利点がゲームの得点です。",
              )}
            </p>
            <button className="primary" onClick={() => setStep(1)}>
              {L("Continue practice", "練習を続ける")}
            </button>
          </>
        )}
        {step === 1 && (
          <>
            <h2>
              {L("2. Make one development decision", "2. 発展の行動を1つ選ぶ")}
            </h2>
            <h3>{text(lang, action.title)}</h3>
            <p>{costText(action.id, c, lang)}</p>
            <p>{text(lang, action.result)}</p>
            <p>
              {L(
                "Prepared example: this attempt will gain 2. Real attempts can gain 1 or 2.",
                "練習用の例：今回は2を獲得します。実際には1または2になります。",
              )}
            </p>
            <button
              className="primary"
              onClick={() => {
                const built = practiceBuild(demo.state, demo.name);
                setDemo({
                  ...demo,
                  state: practiceOffer(built, demo.name, demo.other),
                });
                setStep(2);
              }}
            >
              {L("Try the practice action", "練習の行動を試す")}
            </button>
          </>
        )}
        {step === 2 && (
          <>
            <h2>{L("3. An offer has arrived", "3. 提案が届きました")}</h2>
            <p>
              {countryName(demo.other, lang)}{" "}
              {L(
                "proposes a trade agreement. Your country has 1 team action remaining.",
                "が貿易を提案しています。自国の行動は残り1回です。",
              )}
            </p>
            <button className="primary" onClick={() => setStep(3)}>
              {L("Review practice offer", "練習の提案を確認")}
            </button>
          </>
        )}
        {step === 3 && (
          <>
            <h2>{L("Read before you accept", "承認する前に確認")}</h2>
            <p>
              {L(
                "Both countries spend 1 action and 1 diplomatic influence. Both gain 1 economy. Sending a proposal did not spend anything.",
                "双方が1行動と外交力1を消費し、経済力1を獲得します。提案の送信時には消費しません。",
              )}
            </p>
            <button
              className="primary"
              onClick={() => {
                setDemo({
                  ...demo,
                  state: practiceFinish(practiceAccept(demo.state, demo.name)),
                });
                setStep(4);
                try {
                  localStorage.setItem("practice-v2-complete", "yes");
                } catch {}
              }}
            >
              {L("Accept practice offer", "練習の提案を承認")}
            </button>
          </>
        )}
        {step === 4 && (
          <>
            <h2>{L("4. Review the round", "4. ラウンドを振り返る")}</h2>
            <p>
              {L(
                "Your team used both actions: one development decision and one accepted agreement.",
                "発展の行動と貿易の承認で、チームの2行動を使用しました。",
              )}
            </p>
            <p className="score-line">
              {L("Practice round score:", "練習ラウンドの得点：")}{" "}
              <strong>
                {demo.state.summaries[0].scores[c.name]}{" "}
                {L("victory points", "勝利点")}
              </strong>
            </p>
            <p>
              {L(
                "The score includes 1 point for taking part, plus any country bonuses you reached. In the real game, your teacher starts the next round after discussion. A world event also changes resources when each round begins.",
                "参加点1と、達成した国の目標の追加点が得点になります。本番では振り返りの後に教員が次のラウンドを始めます。各ラウンドの開始時には世界の出来事によって資源も変化します。",
              )}
            </p>
            <button className="primary" onClick={onClose}>
              {L("Finish practice", "練習を終了")}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
