import { text, copy, type Lang } from "@/lib/presentation";
export default function HelpPanel({
  lang,
  onPractice,
  onBriefing,
}: {
  lang: Lang;
  onPractice: () => void;
  onBriefing: () => void;
}) {
  const L = (en: string, ja: string) => text(lang, copy(en, ja));
  return (
    <section className="panel">
      <div className="panel-body">
        <h2>{L("Help with your next decision", "次の行動のためのヘルプ")}</h2>
        <div className="controls">
          <button className="primary" onClick={onPractice}>
            {L("Try the 2-minute practice", "2分間の練習を試す")}
          </button>
          <button onClick={onBriefing}>
            {L("Read your country briefing", "国の概要を読む")}
          </button>
        </div>
        <h3>
          {L("What should I do each round?", "各ラウンドでは何をすればよい？")}
        </h3>
        <ol>
          <li>
            {L(
              "Check your country’s scoring goals and current resources.",
              "自国の得点目標と現在の資源を確認します。",
            )}
          </li>
          <li>
            {L(
              "Talk to other teams and consider your options.",
              "他のチームと話し合い、選択肢を考えます。",
            )}
          </li>
          <li>
            {L(
              "Review a card’s cost and possible result before confirming.",
              "確定する前にカードの消費と結果を確認します。",
            )}
          </li>
          <li>
            {L(
              "Your team shares two actions. Accepting a treaty also uses one.",
              "チームの行動は2回まで。条約の承認も1行動を使います。",
            )}
          </li>
          <li>
            {L(
              "When the round closes, review your victory points and wait for your teacher.",
              "終了後は勝利点を確認し、教員の次の開始を待ちます。",
            )}
          </li>
        </ol>
        <details>
          <summary>
            {L("How trade and alliances work", "貿易・同盟の仕組み")}
          </summary>
          <p>
            {L(
              "Sending proposals is free, but your team must still have an action available to propose. If accepted, each side spends one action and diplomatic influence. Trade gives each side 1 economy. Alliances give each side 1 political power and battle support. Same-ideology alliances or alliances involving a neutral country cost 1 diplomatic influence each; other alliances cost 2 each. At most 3 allies. One accepted trade per country pair each round. Pending proposals expire at round end.",
              "提案は無料ですが、送信するには残り行動が必要です。承認時に双方が1行動と外交力を消費します。貿易は双方の経済力が1増加。同盟は政治力が1増加し援軍を得ます。同陣営か中立国を含む同盟は双方の外交力1、それ以外は2。最大3同盟国。同じ相手との貿易承認は1ラウンド1回まで。未承認の提案は終了時に期限切れになります。",
            )}
          </p>
        </details>
        <details>
          <summary>
            {L("How combat and occupation work", "戦闘・占領の仕組み")}
          </summary>
          <p>
            {L(
              "Attacking uses 2 military strength and 1 political power. After paying, add your remaining military strength, a six-sided die roll, and 2 support per ally (maximum 4). The defender adds military strength, its roll, and allied support. Ties favor defense. Victory gives 3 victory points, takes up to 3 economy, and removes 3 economy and military strength from the target. Defeat costs 2 more military strength and gives the defender 2 victory points. A target with zero economy or military strength after a successful attack becomes occupied.",
              "攻撃は軍事力2と政治力1を消費。その後の軍事力に6面サイコロと同盟援軍（1国2、最大4）を加えます。防衛側も軍事力、サイコロ、援軍を合計。同点は防衛側勝利。攻撃勝利で勝利点3と経済力を最大3獲得し、相手の経済力と軍事力が3減少。敗北すると軍事力を追加で2失い、相手が勝利点2を獲得。勝利後に相手の経済力か軍事力が0なら占領します。",
            )}
          </p>
          <p>
            {L(
              "Occupied countries can rebuild or resist. Resistance costs 2 political power and succeeds half the time. Independence restores economy and military strength to at least 3. Conquering an occupier frees its occupied countries and gives 2 victory points for each one freed. Occupied countries pay 1 economy at round end if they have more than 1 economy.",
              "占領中も復興や抵抗ができます。抵抗は政治力2を消費し、半分の確率で独立。独立すると経済力と軍事力が最低3になります。占領者を征服すると属国を解放し、1国につき勝利点2を獲得。占領国の経済力が2以上ならラウンド終了時に経済力1を支払います。",
            )}
          </p>
        </details>
        <details>
          <summary>
            {L("How round scoring works", "ラウンド得点の仕組み")}
          </summary>
          <p>
            {L(
              "Every country earns 1 victory point per round. Independent countries also earn the bonuses listed on their country card, including partial bonuses. Tribute is paid before scores are calculated. Resources cannot exceed 15; victory points have no limit. Countries with equal final scores share a place.",
              "各国は毎ラウンド勝利点1を獲得。独立国は国のカードに記載された追加点も獲得します。部分達成の追加点もあります。貢納の後に得点を計算。資源は最大15、勝利点は上限なし。最終得点が同じなら同順位です。",
            )}
          </p>
        </details>
      </div>
    </section>
  );
}
