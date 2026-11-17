import {
  RESOURCE_INFO,
  text,
  type Lang,
  type Resource,
} from "@/lib/presentation";
import type { Country } from "@/lib/classroom";
export default function ResourceDisplay({
  country,
  lang,
  explain = false,
}: {
  country: Country;
  lang: Lang;
  explain?: boolean;
}) {
  return (
    <dl className="resource-grid">
      {(Object.keys(RESOURCE_INFO) as Resource[]).map((key) => (
        <div key={key} className={"resource resource-" + key}>
          <dt>
            <span aria-hidden="true">{RESOURCE_INFO[key].icon}</span>{" "}
            {text(lang, RESOURCE_INFO[key])}
          </dt>
          <dd>{country[key]}</dd>
          {explain && <p>{text(lang, RESOURCE_INFO[key].meaning)}</p>}
        </div>
      ))}
    </dl>
  );
}
