import { BookOpenText, Database, ExternalLink, GitBranch, Link2, RotateCcw } from "lucide-preact";
import { useEffect, useMemo, useState } from "preact/hooks";

import { hrefFor } from "../app/router";
import type { EditorialProfile } from "../editorial";
import {
  buildMissionKnowledgeGraph,
  knowledgeGraphNeighbors,
  type KnowledgeGraphEvidenceKind,
  type KnowledgeGraphNode,
} from "../knowledge-graph/model";
import type { RelatedRuntimePeople, RuntimePeopleEntity } from "../providers/peoplegroups";

type LayerFilter = "all" | KnowledgeGraphEvidenceKind;

function kindLabel(kind: KnowledgeGraphNode["kind"]): string {
  if (kind === "source-record") return "Source record";
  if (kind === "mission-classification") return "Mission classification";
  if (kind === "editorial-profile") return "Editorial profile";
  if (kind === "editorial-claim") return "Editorial claim";
  if (kind === "editorial-source") return "Editorial source";
  return kind.replaceAll("-", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function layerLabel(layer: KnowledgeGraphEvidenceKind): string {
  if (layer === "source-field") return "Source facts";
  if (layer === "source-taxonomy") return "Source taxonomy";
  if (layer === "derived-source-relationship") return "Related records";
  return "Reviewed editorial";
}

function layerDescription(layer: KnowledgeGraphEvidenceKind): string {
  if (layer === "source-field") return "Direct fields attached to a specific provider record.";
  if (layer === "source-taxonomy") return "Provider taxonomy labels preserved without stronger identity claims.";
  if (layer === "derived-source-relationship") return "Relationships derived only when explicit taxonomy fields match.";
  return "Separately reviewed Unreached claims and their citations.";
}

export function MissionKnowledgeGraphPanel({
  record,
  related,
  editorial,
}: {
  record: RuntimePeopleEntity;
  related: readonly RelatedRuntimePeople[];
  editorial: EditorialProfile | null;
}) {
  const graph = useMemo(
    () => buildMissionKnowledgeGraph(record, related, editorial),
    [record, related, editorial],
  );
  const nodeById = useMemo(() => new Map(graph.nodes.map((node) => [node.id, node])), [graph]);
  const [focusId, setFocusId] = useState(graph.focusNodeId);
  const [layer, setLayer] = useState<LayerFilter>("all");

  useEffect(() => {
    setFocusId(graph.focusNodeId);
    setLayer("all");
  }, [graph.focusNodeId]);

  const focus = nodeById.get(focusId) ?? nodeById.get(graph.focusNodeId)!;
  const neighbors = useMemo(
    () => knowledgeGraphNeighbors(graph, focus.id).filter((item) => layer === "all" || item.edge.evidenceKind === layer),
    [graph, focus.id, layer],
  );

  const counts = useMemo(() => {
    const result = new Map<KnowledgeGraphEvidenceKind, number>();
    for (const edge of graph.edges) result.set(edge.evidenceKind, (result.get(edge.evidenceKind) ?? 0) + 1);
    return result;
  }, [graph]);

  const layers: KnowledgeGraphEvidenceKind[] = [
    "source-field",
    "source-taxonomy",
    "derived-source-relationship",
    "reviewed-editorial",
  ];

  return (
    <section
      class="mission-knowledge-graph"
      aria-labelledby="mission-knowledge-graph-heading"
      data-phase16-knowledge-graph="true"
      data-graph-node-count={graph.nodes.length}
      data-graph-edge-count={graph.edges.length}
      data-graph-focus={focus.id}
    >
      <div class="mission-knowledge-graph__heading">
        <div>
          <span class="eyebrow">Mission knowledge graph</span>
          <h2 id="mission-knowledge-graph-heading">Trace how this profile's facts and evidence connect.</h2>
        </div>
        <GitBranch size={22} aria-hidden="true" />
      </div>

      <p class="mission-knowledge-graph__intro">
        This is a bounded evidence graph for the current people record—not a similarity engine. Every connection has a typed relationship and an inspectable evidence basis.
      </p>

      <div class="mission-knowledge-graph__boundary" role="note">
        <strong>Connections do not become stronger by appearing in the graph.</strong>
        <p>Provider fields, provider taxonomy, derived taxonomy matches and reviewed editorial claims remain separate evidence layers. Missing edges remain unknown rather than being guessed.</p>
      </div>

      <div class="mission-knowledge-graph__stats" aria-label="Knowledge graph summary">
        <div><span>Nodes</span><strong>{graph.nodes.length}</strong></div>
        <div><span>Relationships</span><strong>{graph.edges.length}</strong></div>
        <div><span>Source systems</span><strong>{graph.sourceIds.length}</strong></div>
        <div><span>Current neighbors</span><strong>{neighbors.length}</strong></div>
      </div>

      <div class="mission-knowledge-graph__layers" aria-label="Graph evidence layers">
        <button type="button" class={layer === "all" ? "is-active" : ""} onClick={() => setLayer("all")}>
          <span>All layers</span><strong>{graph.edges.length}</strong>
        </button>
        {layers.map((item) => (
          <button type="button" class={layer === item ? "is-active" : ""} onClick={() => setLayer(item)} key={item}>
            <span>{layerLabel(item)}</span><strong>{counts.get(item) ?? 0}</strong>
          </button>
        ))}
      </div>

      <div class="mission-knowledge-graph__workspace">
        <article class="mission-knowledge-graph__focus">
          <div class="mission-knowledge-graph__focus-head">
            <div>
              <span>{kindLabel(focus.kind)}</span>
              <h3>{focus.label}</h3>
              {focus.subtitle ? <p>{focus.subtitle}</p> : null}
            </div>
            {focus.id !== graph.focusNodeId ? (
              <button type="button" class="people-reset-filters" onClick={() => setFocusId(graph.focusNodeId)}>
                <RotateCcw size={14} aria-hidden="true" /> Back to people record
              </button>
            ) : null}
          </div>

          {focus.details.length ? (
            <dl class="mission-knowledge-graph__details">
              {focus.details.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
            </dl>
          ) : null}

          <div class="mission-knowledge-graph__focus-actions">
            {focus.route ? <a href={hrefFor(focus.route)}>Open this Unreached record <Link2 size={13} aria-hidden="true" /></a> : null}
            {focus.externalUrl ? <a href={focus.externalUrl} target="_blank" rel="noreferrer">Open cited source <ExternalLink size={13} aria-hidden="true" /></a> : null}
          </div>
        </article>

        <div class="mission-knowledge-graph__neighbors" aria-live="polite">
          <div class="mission-knowledge-graph__neighbors-heading">
            <strong>{neighbors.length} {neighbors.length === 1 ? "connection" : "connections"} from this node</strong>
            <span>{layer === "all" ? "All evidence layers" : layerDescription(layer)}</span>
          </div>

          {neighbors.length ? neighbors.map(({ edge, node, direction }) => (
            <article class={"mission-knowledge-graph__edge mission-knowledge-graph__edge--" + edge.evidenceKind} key={edge.id}>
              <button type="button" class="mission-knowledge-graph__edge-main" onClick={() => setFocusId(node.id)}>
                <span class="mission-knowledge-graph__edge-relation">{direction === "outgoing" ? "→" : "←"} {edge.label}</span>
                <strong>{node.label}</strong>
                <small>{kindLabel(node.kind)}{node.subtitle ? " · " + node.subtitle : ""}</small>
              </button>
              <details>
                <summary><Database size={13} aria-hidden="true" /> Why this connection exists</summary>
                <div>
                  <p>{edge.semantics}</p>
                  <dl>
                    <div><dt>Evidence layer</dt><dd>{layerLabel(edge.evidenceKind)}</dd></div>
                    <div><dt>Source</dt><dd>{edge.sourceId ?? "Project-authored relationship"}</dd></div>
                    {edge.sourceRecordIds.length ? <div><dt>Source records</dt><dd>{edge.sourceRecordIds.join(", ")}</dd></div> : null}
                    {edge.sourceFields.length ? <div><dt>Source fields</dt><dd>{edge.sourceFields.join(", ")}</dd></div> : null}
                  </dl>
                </div>
              </details>
            </article>
          )) : (
            <div class="mission-knowledge-graph__empty" role="note">
              <BookOpenText size={18} aria-hidden="true" />
              <p>No connection in this evidence layer is certified for the focused node. That absence is not treated as proof that no real-world relationship exists.</p>
            </div>
          )}
        </div>
      </div>

      <details class="mission-knowledge-graph__method">
        <summary>Graph boundaries & interpretation</summary>
        <ul>{graph.boundaries.map((item) => <li key={item}>{item}</li>)}</ul>
      </details>
    </section>
  );
}
