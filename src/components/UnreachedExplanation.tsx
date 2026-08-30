import { ShieldQuestion } from "lucide-preact";

import { evangelicalLevelExplanation, reachExplanation } from "../comprehension/explain";
import type { RuntimePeopleEntity } from "../providers/peoplegroups";
import { TermHelp } from "./TermHelp";

export function UnreachedExplanation({ record }: { record: RuntimePeopleEntity }) {
  const context = record.contexts[0]!;
  const unreached = context.reach.classification === "unreached";
  const statusLabel = unreached ? "Unreached" : context.reach.classification === "other" ? "Other GSEC status" : "Status unknown";

  return (
    <section class="unreached-explanation" aria-labelledby="unreached-explanation-heading">
      <div class="unreached-explanation__heading">
        <div>
          <span class="eyebrow">Why this status?</span>
          <h2 id="unreached-explanation-heading">{unreached ? "Why is this people group marked unreached?" : "What does this mission status mean?"}</h2>
        </div>
        <ShieldQuestion size={22} aria-hidden="true" />
      </div>

      <div class="unreached-explanation__status">
        <strong>{statusLabel}</strong>
        <p>{reachExplanation(context)}</p>
      </div>

      <TermHelp term="unreached" />

      {context.reach.evangelicalLevel ? (
        <div class="unreached-evidence">
          <span>Evangelical presence</span>
          <strong>{context.reach.evangelicalLevel}</strong>
          <p>{evangelicalLevelExplanation(context.reach.evangelicalLevel)}</p>
          <TermHelp term="evangelical-level" />
        </div>
      ) : null}

      <details class="unreached-source-classification">
        <summary>See source classification</summary>
        <dl>
          <div><dt>GSEC code</dt><dd>{context.reach.gsec.code ?? "Unknown"}</dd></div>
          <div><dt>Source label</dt><dd>{context.reach.gsec.label ?? "Not supplied"}</dd></div>
          {context.reach.gsec.description ? <div><dt>Source description</dt><dd>{context.reach.gsec.description}</dd></div> : null}
        </dl>
        <TermHelp term="gsec" />
      </details>
    </section>
  );
}
