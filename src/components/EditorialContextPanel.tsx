import { BookOpenText, CheckCircle2, Clock3, Link2, ShieldCheck } from "lucide-preact";

import { claimLabel, isClaimStale, useEditorialContext, type ContextClaim, type EditorialSource, type PeopleContextProfile } from "../context";

function formatDate(value: string | null): string {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function Claim({ claim, sources }: { claim: ContextClaim; sources: Map<string, EditorialSource> }) {
  return (
    <li class={`context-claim context-claim--${claim.kind}`}>
      <div class="context-claim__meta">
        <span>{claimLabel(claim)}</span>
        <span>{claim.certainty} certainty</span>
        {claim.temporalClass === "current" ? <span>As of {formatDate(claim.asOf)}</span> : <span>Stable context</span>}
      </div>
      <p>{claim.text}</p>
      {claim.interpretationNote ? <p class="context-interpretation-note"><strong>Interpretation note:</strong> {claim.interpretationNote}</p> : null}
      <div class="context-citations" aria-label="Sources for this claim">
        {claim.citationIds.map((sourceId) => {
          const source = sources.get(sourceId);
          return source ? <a href={source.url} target="_blank" rel="noreferrer" key={sourceId}>{source.title}</a> : <span key={sourceId}>{sourceId}</span>;
        })}
      </div>
      {claim.temporalClass === "current" ? <small class={`context-freshness${isClaimStale(claim) ? " is-stale" : ""}`}><Clock3 size={13} aria-hidden="true" /> Review by {formatDate(claim.reviewAfter)}</small> : null}
    </li>
  );
}

function Claims({ claimIds, profile, sources }: { claimIds: string[]; profile: PeopleContextProfile; sources: Map<string, EditorialSource> }) {
  const byId = new Map(profile.claims.map((claim) => [claim.id, claim]));
  return <ul class="context-claim-list">{claimIds.map((id) => byId.get(id)).filter((claim): claim is ContextClaim => Boolean(claim)).map((claim) => <Claim key={claim.id} claim={claim} sources={sources} />)}</ul>;
}

export function EditorialContextPanel({ peid }: { peid: number }) {
  const context = useEditorialContext();
  const profile = context.profilesByPeid.get(peid) ?? null;
  const sources = new Map((context.dataset?.sources ?? []).map((source) => [source.id, source]));

  if (context.loading) return <section class="context-state" role="status">Loading reviewed editorial context…</section>;
  if (!profile) {
    return (
      <section class="context-state" aria-label="Editorial context status">
        <BookOpenText size={20} aria-hidden="true" />
        <div><strong>Reviewed context not yet published for this PEID</strong><p>{context.error ?? context.status?.reason ?? "The live source profile remains available, but a reviewed contextual article has not yet been released for this people entity."}</p></div>
      </section>
    );
  }

  const reviewDate = profile.review.reviewedAt ? new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" }).format(new Date(profile.review.reviewedAt)) : "Not recorded";
  const identity = profile.identity;

  return (
    <section class="context-editorial" aria-labelledby="context-heading">
      <header class="context-editorial__header">
        <div><span class="eyebrow">Reviewed editorial context</span><h2 id="context-heading">Understand their world.</h2></div>
        <div class="context-review-badge"><ShieldCheck size={17} aria-hidden="true" /><span>Tier {profile.review.qualityTier} · {profile.review.status}</span></div>
      </header>

      <div class="context-identity-note" aria-label="Editorial identity verification">
        <strong>PEID identity verified</strong>
        <span>PeopleGroups PEID {profile.peid} · {identity.pgidAnchors.join(", ")} · {identity.countryIso3Anchors.join(", ")} · {identity.languageIso6393Anchors.join(", ")}</span>
        <small>This article is attached through explicit provider identity evidence. Legacy numeric IDs are never treated as PEIDs by coincidence.</small>
      </div>

      <div class="context-editorial__grid">
        <section class="context-section" aria-labelledby="who-they-are-heading">
          <div class="context-section__heading"><BookOpenText size={19} aria-hidden="true" /><div><span class="eyebrow">Identity & context</span><h3 id="who-they-are-heading">Who are they?</h3></div></div>
          <p class="context-section__summary">{profile.whoTheyAre.summary}</p>
          <Claims claimIds={profile.whoTheyAre.claimIds} profile={profile} sources={sources} />
        </section>

        {profile.religionAndCommunity ? (
          <section class="context-section" aria-labelledby="religion-community-heading">
            <div class="context-section__heading"><CheckCircle2 size={19} aria-hidden="true" /><div><span class="eyebrow">Religion & community</span><h3 id="religion-community-heading">Community context</h3></div></div>
            <p class="context-section__summary">{profile.religionAndCommunity.summary}</p>
            <Claims claimIds={profile.religionAndCommunity.claimIds} profile={profile} sources={sources} />
          </section>
        ) : null}
      </div>

      <section class="why-unreached" aria-labelledby="why-unreached-heading">
        <div class="why-unreached__heading"><div><span class="eyebrow">Evidence-backed synthesis</span><h3 id="why-unreached-heading">Why are they unreached?</h3></div></div>
        <p class="why-unreached__intro">{profile.whyUnreachedIntro}</p>
        <p class="why-unreached__guardrail">These factors describe documented access conditions. They are not claims that a culture, religion, or people is inherently resistant to Christianity.</p>
        <div class="why-unreached__grid">
          {profile.whyUnreached.map((section) => (
            <article class="why-unreached-card" key={`${section.dimension}-${section.heading}`}>
              <span>{section.dimension.replaceAll("-", " ")}</span>
              <h4>{section.heading}</h4>
              <p>{section.summary}</p>
              <Claims claimIds={section.claimIds} profile={profile} sources={sources} />
            </article>
          ))}
        </div>
      </section>

      <footer class="context-editorial__footer">
        <div><strong>Editorial review</strong><span>Reviewed {reviewDate} · {profile.review.reviewerRole ?? "Reviewer role not recorded"}</span>{profile.review.aiAssisted ? <small>AI-assisted drafting was permitted; factual claims are sourced and the published profile passed the release editorial checklist.</small> : null}</div>
        <details>
          <summary><Link2 size={15} aria-hidden="true" /> Editorial sources ({profile.sourceIds.length})</summary>
          <ul>{profile.sourceIds.map((id) => { const source = sources.get(id); return <li key={id}>{source ? <a href={source.url} target="_blank" rel="noreferrer"><strong>{source.title}</strong><span>{source.publisher ?? source.sourceType}{source.publicationDate ? ` · ${source.publicationDate}` : ""}{source.locator ? ` · ${source.locator}` : ""}</span></a> : id}</li>; })}</ul>
        </details>
      </footer>
    </section>
  );
}
