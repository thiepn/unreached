import { BookOpenText, CheckCircle2, Link2, ShieldCheck } from "lucide-preact";

import type { EditorialClaim, EditorialProfile, EditorialSection, EditorialSource } from "../editorial";

function formatDate(value: string | null): string {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(date);
}

function tierLabel(profile: EditorialProfile): string {
  if (profile.tier === "reviewed") return "Reviewed profile";
  if (profile.tier === "enhanced") return "Curated profile";
  return "Source profile";
}

function sourceMap(profile: EditorialProfile): Map<string, EditorialSource> {
  return new Map(profile.sources.map((source) => [source.id, source]));
}

function claimMap(profile: EditorialProfile): Map<string, EditorialClaim> {
  return new Map(profile.claims.map((claim) => [claim.id, claim]));
}

function SectionEvidence({ section, profile }: { section: EditorialSection; profile: EditorialProfile }) {
  const claims = claimMap(profile);
  const sources = sourceMap(profile);
  const sectionClaims = section.claimIds.map((id) => claims.get(id)).filter((claim): claim is EditorialClaim => Boolean(claim));
  if (!sectionClaims.length) return null;

  const sourceIds = [...new Set(sectionClaims.flatMap((claim) => claim.citationIds))];
  return (
    <details class="v3-people-evidence">
      <summary><Link2 size={15} aria-hidden="true" /> Evidence & sources</summary>
      <div class="v3-people-evidence__body">
        <ul class="v3-people-evidence__claims">
          {sectionClaims.map((claim) => (
            <li key={claim.id}>
              <div><span>{claim.kind}</span><span>{claim.evidenceLevel} evidence</span><span>{claim.certainty} certainty</span></div>
              <p>{claim.text}</p>
              {claim.interpretationNote ? <small><strong>Interpretation note:</strong> {claim.interpretationNote}</small> : null}
            </li>
          ))}
        </ul>
        <div class="v3-people-evidence__sources">
          {sourceIds.map((id) => {
            const source = sources.get(id);
            return source
              ? <a key={id} href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
              : <span key={id}>{id}</span>;
          })}
        </div>
      </div>
    </details>
  );
}

export function DefinitiveEditorialProfile({ profile }: { profile: EditorialProfile }) {
  if (profile.tier === "source") {
    return (
      <section class="v3-people-editorial v3-people-editorial--source" data-editorial-tier="source" aria-labelledby="v3-editorial-heading">
        <div class="v3-people-editorial__heading">
          <div><span class="eyebrow">Editorial depth</span><h2 id="v3-editorial-heading">Source context only.</h2></div>
          <span class="v3-people-tier"><BookOpenText size={15} aria-hidden="true" /> Source profile</span>
        </div>
        <p class="v3-people-editorial__deck">{profile.deck}</p>
        <div class="v3-people-editorial__absence" role="note">
          <strong>Reviewed editorial context is not yet published for this record.</strong>
          <p>The structured source facts remain available throughout this profile. Unreached does not generate cultural, historical, religious, or gospel-access narrative merely to make an incomplete profile look researched.</p>
        </div>
      </section>
    );
  }

  return (
    <section class="v3-people-editorial" data-editorial-tier={profile.tier} aria-labelledby="v3-editorial-heading">
      <div class="v3-people-editorial__heading">
        <div><span class="eyebrow">Understand their world</span><h2 id="v3-editorial-heading">Context before conclusions.</h2></div>
        <span class={`v3-people-tier v3-people-tier--${profile.tier}`}><ShieldCheck size={15} aria-hidden="true" /> {tierLabel(profile)}</span>
      </div>
      <p class="v3-people-editorial__deck">{profile.deck}</p>

      <div class="v3-people-article">
        {profile.sections.map((section) => (
          <article class={`v3-people-article__section v3-people-article__section--${section.key}`} key={section.key}>
            <span class="v3-people-article__kicker">{section.key.replaceAll("-", " ")}</span>
            <h3>{section.heading}</h3>
            <p>{section.body}</p>
            <SectionEvidence section={section} profile={profile} />
          </article>
        ))}
      </div>

      {profile.prayerPrompts.length ? (
        <section class="v3-people-prayer-context" aria-labelledby="v3-prayer-context-heading">
          <div class="v3-people-prayer-context__heading"><CheckCircle2 size={18} aria-hidden="true" /><div><span class="eyebrow">Prayer from evidence</span><h3 id="v3-prayer-context-heading">Pray from what is actually known.</h3></div></div>
          <div class="v3-people-prayer-prompts">
            {profile.prayerPrompts.map((prompt) => (
              <article key={prompt.id}>
                <span>{prompt.category.replaceAll("-", " ")}</span>
                <p>{prompt.text}</p>
                {prompt.scriptureReference ? <small>{prompt.scriptureReference}</small> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <footer class="v3-people-editorial__footer">
        <div>
          <strong>{tierLabel(profile)}</strong>
          <span>{profile.review.reviewedAt ? `Reviewed ${formatDate(profile.review.reviewedAt)}` : "Review date not recorded"}{profile.review.reviewerRole ? ` · ${profile.review.reviewerRole}` : ""}</span>
          {profile.review.aiAssisted ? <small>AI-assisted drafting was permitted; publication requires cited material claims and editorial review.</small> : null}
        </div>
        <details>
          <summary><Link2 size={15} aria-hidden="true" /> Editorial sources ({profile.sources.length})</summary>
          <ul>{profile.sources.map((source) => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer"><strong>{source.title}</strong><span>{source.publisher ?? source.sourceType}</span></a></li>)}</ul>
        </details>
        {profile.researchGaps.length ? (
          <details>
            <summary>Research gaps ({profile.researchGaps.length})</summary>
            <ul>{profile.researchGaps.map((gap) => <li key={gap.sectionKey}><strong>{gap.sectionKey.replaceAll("-", " ")}</strong><span>{gap.note}</span></li>)}</ul>
          </details>
        ) : null}
      </footer>
    </section>
  );
}
