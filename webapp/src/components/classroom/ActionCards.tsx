"use client";
import { useState } from "react";
import Image from "next/image";
import {
  ACTIONS,
  themeFor,
  costText,
  unavailable,
  text,
  copy,
  type Lang,
  type ActionId,
} from "@/lib/presentation";
import { BUILD_RULES } from "@/lib/rules";
import type { Country, State } from "@/lib/classroom";
const GROUPS = [
  copy("Develop your country", "国を発展させる"),
  copy("Work with other countries", "他国と協力する"),
  copy("Military and intelligence", "軍事と諜報"),
  copy("Your country’s special power", "国の特殊能力"),
];
export default function ActionCards({
  state: s,
  country: c,
  lang,
  onChoose,
  disabled,
}: {
  state: State;
  country: Country;
  lang: Lang;
  onChoose: (id: ActionId) => void;
  disabled: boolean;
}) {
  const [group, setGroup] = useState(0);
  const available = GROUPS.map((g, index) => ({
    g,
    index,
    list: ACTIONS.filter(
      (a) =>
        a.group === index &&
        (c.master
          ? ["REBUILD", "RESIST"].includes(a.id)
          : !["REBUILD", "RESIST"].includes(a.id)),
    ),
  })).filter((g) => g.list.length);
  const activeGroup = available.some((g) => g.index === group)
    ? group
    : available[0]?.index;
  return (
    <div className="decision-groups">
      <nav
        className="decision-categories"
        aria-label={text(lang, copy("Decision categories", "行動の種類"))}
      >
        {available.map((g) => (
          <button
            key={g.index}
            aria-pressed={activeGroup === g.index}
            onClick={() => setGroup(g.index)}
          >
            {text(lang, g.g)}
          </button>
        ))}
      </nav>
      {GROUPS.map((g, index) => {
        const list = ACTIONS.filter(
          (a) =>
            a.group === index &&
            (c.master
              ? ["REBUILD", "RESIST"].includes(a.id)
              : !["REBUILD", "RESIST"].includes(a.id)),
        );
        if (!list.length || index !== activeGroup) return null;
        return (
          <section key={index}>
            <h2>{text(lang, g)}</h2>
            <div className="decision-grid">
              {list.map((a) => {
                const theme = themeFor(a.id, c.name, s.round),
                  reason = unavailable(s, c, a.id, lang),
                  rule = BUILD_RULES[a.id];
                return (
                  <article
                    className={"decision-card " + (reason ? "unavailable" : "")}
                    key={a.id}
                  >
                    <Image
                      src={"/art/" + (theme?.art ?? a.art) + ".webp"}
                      alt={text(lang, theme?.title ?? a.title)}
                      width={480}
                      height={240}
                    />
                    <div className="decision-content">
                      {theme && (
                        <span className="card-category">
                          {text(lang, a.title)}
                        </span>
                      )}
                      <h3>{text(lang, theme?.title ?? a.title)}</h3>
                      <p>{text(lang, a.purpose)}</p>
                      <p className="card-cost">{costText(a.id, c, lang)}</p>
                      <p className="card-result">{text(lang, a.result)}</p>
                      {rule && (
                        <small>
                          {text(
                            lang,
                            copy(
                              `${(11 - rule.threshold) * 10}% chance to gain 2; otherwise gain 1.`,
                              `${(11 - rule.threshold) * 10}%で2獲得。それ以外は1獲得。`,
                            ),
                          )}
                        </small>
                      )}
                      {reason && <p className="availability">{reason}</p>}
                      <button
                        disabled={disabled || !!reason}
                        onClick={() => onChoose(a.id)}
                      >
                        {text(
                          lang,
                          copy("Review this decision", "この行動を確認"),
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
