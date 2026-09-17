import { ArrowUpRight, Database, RefreshCw } from "lucide-preact";
import { useState } from "preact/hooks";

import type { PeopleProfileRecord } from "../peoples/profile";
import { formatJoshuaEstimate, joshuaProjectMissionAssertion, type JoshuaProjectComparisonRecord } from "../mission/joshua-project";
import { fetchJoshuaProjectComparison } from "../mission/multi-source-client";
import { compareMissionAssertions, reviewedMissionSourceCrosswalk } from "../mission/multi-source";

type LoadState =
  | { status: "idle"; record: null; error: null }
  | { status: "loading"; record: null; error: null }
  | { status: "ready"; record: JoshuaProjectComparisonRecord; error: null }
  | { status: "error"; record: null; error: string };

function classificationLabel(value: "unreached" | "not-unreached" | "unknown"): string {
  if (value === "unreached") return "Unreached";
  if (value === "not-unreached") return "Does not meet this source's unreached rule";
  return "Unknown";
}

function comparisonLabel(state: "agreement" | "disagreement" | "incomplete"): string {
  if (state === "agreement") return "Sources currently agree";
  if (state === "disagreement") return "Sources currently differ";
  return "Comparison incomplete";
}

export function MultiSourceMissionPanel({ record }: { record: PeopleProfileRecord }) {
  const context = record.contexts[0]!;
  const crosswalk = reviewedMissionSourceCrosswalk(record.peid, context.pgid, context.country.iso3);
  const [load, setLoad] = useState<LoadState>({ status: "idle", record: null, error: null });

  if (!crosswalk) return null;

  const loadComparison = async () => {
    setLoad({ status: "loading", record: null, error: null });
    try {
      const secondary = await fetchJoshuaProjectComparison(crosswalk);
      setLoad({ status: "ready", record: secondary, error: null });
    } catch (error) {
      setLoad({
        status: "error",
        record: null,
        error: error instanceof Error ? error.message : "The secondary mission source is unavailable.",
      });
    }
  };

  const secondaryAssertion = load.status === "ready" ? joshuaProjectMissionAssertion(load.record) : null;
  const comparison = secondaryAssertion
    ? compareMissionAssertions(context.reach.assertion, secondaryAssertion)
    : null;

  return (
    <section class="people-section people-section--source v3-people-source-context" aria-labelledby="multi-source-mission-heading" data-phase13-multi-source="true">
      <div class="people-section__heading">
        <div><span class="eyebrow">Mission intelligence · Phase 13</span><h2 id="multi-source-mission-heading">Compare source methodologies</h2></div>
        <Database size={21} aria-hidden="true" />
      </div>
      <p class="people-section__intro">This optional comparison keeps PeopleGroups.org / IMB and Joshua Project as separate research sources. Unreached does not average their values, silently reconcile disagreement, or turn either methodology into a universal verdict.</p>

      {load.status === "idle" ? (
        <div class="people-context-absence" role="note">
          <strong>A manually reviewed cross-source identity link is available.</strong>
          <p>Joshua Project data is requested only when you choose to compare sources. It is not written into the Unreached corpus or browser persistence.</p>
          <button type="button" class="people-reset-filters" onClick={loadComparison}>Compare mission sources</button>
        </div>
      ) : null}

      {load.status === "loading" ? <div class="people-context-absence" role="status"><strong>Loading the secondary source…</strong><p>The browser is requesting a narrow, no-store record through the Unreached edge service; the Joshua Project API credential never enters the page.</p></div> : null}

      {load.status === "error" ? (
        <div class="people-context-absence" role="status">
          <strong>Secondary source unavailable.</strong>
          <p>{load.error}</p>
          <button type="button" class="people-reset-filters" onClick={loadComparison}><RefreshCw size={15} aria-hidden="true" /> Retry comparison</button>
        </div>
      ) : null}

      {load.status === "ready" && secondaryAssertion && comparison ? (
        <div class="people-disclosure__body" data-comparison-state={comparison.state}>
          <div class="people-source-record-grid people-source-record-grid--comprehension" aria-label="Mission source comparison">
            <div>
              <span>PeopleGroups.org / IMB</span>
              <strong>{classificationLabel(context.reach.assertion.classification)}</strong>
              <p>{context.reach.assertion.sourceLabel ?? "Source classification label unavailable"}</p>
              <small>{context.reach.assertion.definition}</small>
            </div>
            <div>
              <span>Joshua Project</span>
              <strong>{classificationLabel(secondaryAssertion.classification)}</strong>
              <p>{secondaryAssertion.sourceLabel ?? "Source classification label unavailable"}{load.record.jpScale === null ? "" : ` · JP Scale ${load.record.jpScale}`}</p>
              <small>{secondaryAssertion.definition}</small>
            </div>
          </div>

          <div class="people-context-absence" role="note">
            <strong>{comparisonLabel(comparison.state)}</strong>
            <p>{comparison.explanation}</p>
          </div>

          <dl class="people-detail-list">
            <div><dt>Joshua Project record</dt><dd>{load.record.peopleName} · {load.record.countryName} · {load.record.peopleId3Rog3}</dd></div>
            <div><dt>Christian adherents</dt><dd>{formatJoshuaEstimate(load.record.percentAdherents)}</dd></div>
            <div><dt>Evangelicals</dt><dd>{formatJoshuaEstimate(load.record.percentEvangelical)}</dd></div>
            <div><dt>Frontier</dt><dd>{load.record.frontier === null ? "Unknown" : load.record.frontier ? "Yes" : "No"}</dd></div>
            <div><dt>Identity review</dt><dd>{crosswalk.reviewedAt} · manual provider-to-provider crosswalk</dd></div>
            <div><dt>Retrieved</dt><dd>{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(load.record.retrievedAt))}</dd></div>
          </dl>

          <p class="people-basis-note">Percentages are displayed as Joshua Project estimates. A displayed zero must not be interpreted as proof of a measured absolute zero. The provider's <code>LeastReached</code> value is retained rather than reconstructed from rounded percentages.</p>
          <div class="people-source-record-actions">
            <a href={load.record.sourceProfileUrl} target="_blank" rel="noreferrer">Data provided by Joshua Project <ArrowUpRight size={13} aria-hidden="true" /></a>
          </div>
        </div>
      ) : null}
    </section>
  );
}
