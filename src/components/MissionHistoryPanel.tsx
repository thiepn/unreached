import { History, RotateCcw } from "lucide-preact";
import { useEffect, useState } from "preact/hooks";

import type { PeopleProfileRecord } from "../peoples/profile";
import {
  compareMissionHistoryObservations,
  type MissionHistoryChange,
  type MissionHistoryObservation,
} from "../mission/history";
import { recordPeopleGroupsObservation, resetPeopleGroupsHistory } from "../mission/history-store";

type HistoryState =
  | { status: "loading"; observations: MissionHistoryObservation[]; error: null }
  | { status: "ready"; observations: MissionHistoryObservation[]; error: null }
  | { status: "error"; observations: MissionHistoryObservation[]; error: string };

function formatDate(value: string | null): string {
  if (!value) return "Date not supplied";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not supplied";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatClassification(value: MissionHistoryObservation["metrics"]["classification"]): string {
  if (value === "unreached") return "Unreached";
  if (value === "not-unreached") return "Does not meet IMB unreached rule";
  return "Unknown";
}

function formatCount(value: number | null): string {
  return value === null ? "Unknown" : new Intl.NumberFormat().format(value);
}

const changeLabels: Record<MissionHistoryChange["field"], string> = {
  classification: "Mission classification",
  gsec: "GSEC",
  evangelicalLevel: "Evangelical level",
  engagementStatus: "Engagement status",
  congregationExists: "Congregation exists",
  churchPlanting: "Church planting",
  population: "Population estimate",
  bibleAvailability: "Bible availability",
  jesusFilmAvailability: "Jesus Film availability",
};

function formatChangeValue(change: MissionHistoryChange, value: MissionHistoryChange["before"]): string {
  if (change.field === "classification") return formatClassification(value as MissionHistoryObservation["metrics"]["classification"]);
  if (change.field === "population") return formatCount(value as number | null);
  if (value === null) return "Unknown";
  return String(value);
}

function ChangeList({ changes }: { changes: MissionHistoryChange[] }) {
  if (!changes.length) return <p class="mission-history-card__unchanged">No tracked mission field changed from the previous stored state.</p>;
  return (
    <ul class="mission-history-change-list" aria-label="Changes from previous source state">
      {changes.map((change) => (
        <li key={change.field}>
          <strong>{changeLabels[change.field]}</strong>
          <span>{formatChangeValue(change, change.before)} → {formatChangeValue(change, change.after)}</span>
        </li>
      ))}
    </ul>
  );
}

export function MissionHistoryPanel({ record }: { record: PeopleProfileRecord }) {
  const context = record.contexts[0]!;
  const [state, setState] = useState<HistoryState>({ status: "loading", observations: [], error: null });

  useEffect(() => {
    let active = true;
    setState({ status: "loading", observations: [], error: null });
    void recordPeopleGroupsObservation(record)
      .then((observations) => {
        if (active) setState({ status: "ready", observations, error: null });
      })
      .catch((error) => {
        if (active) {
          setState({
            status: "error",
            observations: [],
            error: error instanceof Error ? error.message : "Local source history is unavailable.",
          });
        }
      });
    return () => { active = false; };
  }, [record]);

  const reset = async () => {
    setState((current) => ({ status: "loading", observations: current.observations, error: null }));
    try {
      const observations = await resetPeopleGroupsHistory(record);
      setState({ status: "ready", observations, error: null });
    } catch (error) {
      setState({
        status: "error",
        observations: state.observations,
        error: error instanceof Error ? error.message : "Local source history could not be reset.",
      });
    }
  };

  const observations = state.observations;
  const latestChanges = observations.length > 1
    ? compareMissionHistoryObservations(observations[1]!, observations[0]!)
    : [];

  return (
    <section
      class="people-section people-section--source v3-people-source-context mission-history-panel"
      aria-labelledby="mission-history-heading"
      data-phase14-history="true"
      data-history-count={observations.length}
    >
      <div class="people-section__heading">
        <div><span class="eyebrow">Historical mission intelligence</span><h2 id="mission-history-heading">Source history on this device</h2></div>
        <History size={21} aria-hidden="true" />
      </div>
      <p class="people-section__intro">Unreached keeps a bounded, device-private history of this PeopleGroups.org record. A new timeline point is created only when the tracked state changes from the latest stored state. Consecutive repeated visits do not manufacture a trend.</p>

      <div class="mission-history-boundary" role="note">
        <strong>Observed history, not reconstructed history.</strong>
        <p>PeopleGroups.org separately publishes historical GSEC overview PDFs at global aggregate level. This per-record feature does not treat those reports as prior states for this PGID. Earlier values are never inferred from today's record. This local history is excluded from account sync, server storage and exports.</p>
        <a href="https://peoplegroups.org/downloads/" target="_blank" rel="noreferrer">Open PeopleGroups.org historical GSEC overview archive</a>
      </div>

      {state.status === "loading" && !observations.length ? <div class="people-context-absence" role="status"><strong>Preparing local source history…</strong></div> : null}
      {state.status === "error" ? <div class="people-context-absence" role="status"><strong>Local source history unavailable.</strong><p>{state.error}</p></div> : null}

      {state.status === "ready" && observations.length === 1 ? (
        <div class="people-context-absence" role="note">
          <strong>History starts with this verified source observation.</strong>
          <p>No earlier local observation exists for {context.pgid}. If a tracked provider field changes on a later visit, the previous state will remain here for comparison.</p>
        </div>
      ) : null}

      {state.status === "ready" && observations.length > 1 ? (
        <>
          <div class="mission-history-summary" role="status">
            <span>{observations.length} local source-history points</span>
            <strong>{latestChanges.length === 1 ? "1 tracked field changed since the previous state" : `${latestChanges.length} tracked fields changed since the previous state`}</strong>
          </div>
          <ol class="mission-history-timeline" aria-label="PeopleGroups.org source history">
            {observations.map((observation, index) => {
              const previous = observations[index + 1] ?? null;
              const changes = previous ? compareMissionHistoryObservations(previous, observation) : [];
              return (
                <li class="mission-history-card" key={observation.id}>
                  <div class="mission-history-card__head">
                    <div>
                      <span>{index === 0 ? "Current stored state" : "Earlier stored state"}</span>
                      <strong>{formatClassification(observation.metrics.classification)}</strong>
                    </div>
                    <time dateTime={observation.sourceUpdatedAt ?? observation.firstObservedAt}>
                      {observation.sourceUpdatedAt ? `Source updated ${formatDate(observation.sourceUpdatedAt)}` : `First observed ${formatDate(observation.firstObservedAt)}`}
                    </time>
                  </div>
                  <dl class="mission-history-metrics">
                    <div><dt>GSEC</dt><dd>{observation.metrics.gsec ?? "Unknown"}</dd></div>
                    <div><dt>Population</dt><dd>{formatCount(observation.metrics.population)}</dd></div>
                    <div><dt>Evangelical level</dt><dd>{observation.metrics.evangelicalLevel ?? "Unknown"}</dd></div>
                    <div><dt>Engagement</dt><dd>{observation.metrics.engagementStatus ?? "Unknown"}</dd></div>
                  </dl>
                  {observation.latestSourceUpdatedAt && observation.sourceUpdatedAt && observation.latestSourceUpdatedAt !== observation.sourceUpdatedAt ? (
                    <p class="mission-history-card__seen">Tracked fields stayed unchanged through provider update {formatDate(observation.latestSourceUpdatedAt)}.</p>
                  ) : null}
                  <p class="mission-history-card__seen">Observed on this device {formatDateTime(observation.firstObservedAt)}{observation.lastObservedAt !== observation.firstObservedAt ? ` · last seen ${formatDateTime(observation.lastObservedAt)}` : ""}.</p>
                  {previous ? <ChangeList changes={changes} /> : <p class="mission-history-card__baseline">Oldest retained local state; no earlier observation is available for comparison.</p>}
                </li>
              );
            })}
          </ol>
        </>
      ) : null}

      {state.status === "ready" ? (
        <div class="people-source-record-actions">
          <button type="button" class="people-reset-filters" onClick={reset}><RotateCcw size={15} aria-hidden="true" /> Reset local history to current state</button>
        </div>
      ) : null}
    </section>
  );
}
