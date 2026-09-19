import { z } from "zod";

import type { EditorialProfile } from "../editorial";
import type { RelatedRuntimePeople, RuntimePeopleEntity } from "../providers/peoplegroups";

export const knowledgeGraphNodeKindSchema = z.enum([
  "people",
  "source-record",
  "country",
  "language",
  "religion",
  "mission-classification",
  "resource",
  "taxonomy",
  "editorial-profile",
  "editorial-claim",
  "editorial-source",
]);
export type KnowledgeGraphNodeKind = z.infer<typeof knowledgeGraphNodeKindSchema>;

export const knowledgeGraphEvidenceKindSchema = z.enum([
  "source-field",
  "source-taxonomy",
  "derived-source-relationship",
  "reviewed-editorial",
]);
export type KnowledgeGraphEvidenceKind = z.infer<typeof knowledgeGraphEvidenceKindSchema>;

export const knowledgeGraphRelationSchema = z.enum([
  "has-source-record",
  "located-in",
  "primary-language-reported",
  "primary-religion-reported",
  "mission-classification-reported",
  "bible-availability-reported",
  "jesus-film-availability-reported",
  "resource-total-reported",
  "taxonomy-label-reported",
  "related-by-source-taxonomy",
  "has-reviewed-editorial",
  "contains-reviewed-claim",
  "claim-cites-source",
]);
export type KnowledgeGraphRelation = z.infer<typeof knowledgeGraphRelationSchema>;

const detailSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

export const knowledgeGraphNodeSchema = z.object({
  id: z.string().min(1),
  kind: knowledgeGraphNodeKindSchema,
  label: z.string().min(1),
  subtitle: z.string().nullable(),
  route: z.string().startsWith("/").nullable(),
  externalUrl: z.string().url().nullable(),
  details: z.array(detailSchema),
});
export type KnowledgeGraphNode = z.infer<typeof knowledgeGraphNodeSchema>;

export const knowledgeGraphEdgeSchema = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  relation: knowledgeGraphRelationSchema,
  label: z.string().min(1),
  evidenceKind: knowledgeGraphEvidenceKindSchema,
  sourceId: z.string().nullable(),
  sourceRecordIds: z.array(z.string().min(1)),
  sourceFields: z.array(z.string().min(1)),
  semantics: z.string().min(1),
});
export type KnowledgeGraphEdge = z.infer<typeof knowledgeGraphEdgeSchema>;

export const missionKnowledgeGraphSchema = z.object({
  schemaVersion: z.literal(1),
  focusNodeId: z.string().min(1),
  nodes: z.array(knowledgeGraphNodeSchema).min(1),
  edges: z.array(knowledgeGraphEdgeSchema),
  sourceIds: z.array(z.string().min(1)),
  boundaries: z.array(z.string().min(1)),
});
export type MissionKnowledgeGraph = z.infer<typeof missionKnowledgeGraphSchema>;

function encoded(value: string): string {
  return encodeURIComponent(value.trim().toLocaleLowerCase("en"));
}

function text(value: string | number | null): string {
  return value === null ? "Unknown" : String(value);
}

function relationLabel(relation: RelatedRuntimePeople["relationship"]): string {
  if (relation === "same-rop3-name") return "Same ROP3 people name";
  if (relation === "same-cluster") return "Same people cluster";
  return "Same affinity bloc";
}

function relationField(relation: RelatedRuntimePeople["relationship"]): string {
  if (relation === "same-rop3-name") return "PplNm";
  if (relation === "same-cluster") return "PplClstr";
  return "Affbloc";
}

function relationSemantics(relation: RelatedRuntimePeople["relationship"]): string {
  if (relation === "same-rop3-name") {
    return "Both PeopleGroups.org records report the same ROP3 people-name field. This is a provider taxonomy relationship, not proof that the records are one universal ethnic identity.";
  }
  if (relation === "same-cluster") {
    return "Both PeopleGroups.org records report the same people-cluster field. Cluster membership is retained as provider taxonomy and does not imply identical culture, language, country context or mission status.";
  }
  return "Both PeopleGroups.org records report the same affinity-bloc field. Affinity-bloc membership is a broad provider taxonomy relationship and does not imply close identity or interchangeability.";
}

export function buildMissionKnowledgeGraph(
  record: RuntimePeopleEntity,
  related: readonly RelatedRuntimePeople[] = [],
  editorial: EditorialProfile | null = null,
): MissionKnowledgeGraph {
  const context = record.contexts[0]!;
  const nodes = new Map<string, KnowledgeGraphNode>();
  const edges = new Map<string, KnowledgeGraphEdge>();

  const addNode = (node: KnowledgeGraphNode): void => {
    const parsed = knowledgeGraphNodeSchema.parse(node);
    const existing = nodes.get(parsed.id);
    if (existing && JSON.stringify(existing) !== JSON.stringify(parsed)) {
      throw new Error(`Knowledge graph node identity collision: ${parsed.id}`);
    }
    nodes.set(parsed.id, parsed);
  };

  const addEdge = (edge: Omit<KnowledgeGraphEdge, "id">): void => {
    if (edge.from === edge.to) throw new Error(`Knowledge graph self-edge is not allowed: ${edge.from}`);
    const id = `edge:${edge.relation}:${edge.from}->${edge.to}`;
    const parsed = knowledgeGraphEdgeSchema.parse({ ...edge, id });
    const existing = edges.get(id);
    if (existing && JSON.stringify(existing) !== JSON.stringify(parsed)) {
      throw new Error(`Knowledge graph edge identity collision: ${id}`);
    }
    edges.set(id, parsed);
  };

  const peopleId = `people:peoplegroups:${record.peid}`;
  const sourceRecordId = `source-record:peoplegroups:${context.pgid}`;

  addNode({
    id: peopleId,
    kind: "people",
    label: record.displayName,
    subtitle: `PEID ${record.peid}`,
    route: `/peoples/${record.routeKey}`,
    externalUrl: null,
    details: [
      { label: "Provider", value: "PeopleGroups.org / IMB Global Research" },
      { label: "Country context", value: context.country.name },
    ],
  });
  addNode({
    id: sourceRecordId,
    kind: "source-record",
    label: context.pgid,
    subtitle: "People-group-in-country source record",
    route: null,
    externalUrl: null,
    details: [
      { label: "PEID", value: String(record.peid) },
      { label: "Provider", value: "PeopleGroups.org / IMB Global Research" },
      { label: "Source updated", value: context.sourceUpdatedAt ?? "Not supplied" },
    ],
  });
  addEdge({
    from: peopleId,
    to: sourceRecordId,
    relation: "has-source-record",
    label: "Has source record",
    evidenceKind: "source-field",
    sourceId: "peoplegroups-org-api",
    sourceRecordIds: [context.pgid],
    sourceFields: ["PEID", "PGID"],
    semantics: "This edge links the current compatibility people entity to its certified one-to-one PeopleGroups.org PGID record. It does not merge multiple country records into one person identity.",
  });

  const countryId = `country:${context.country.iso3}`;
  addNode({
    id: countryId,
    kind: "country",
    label: context.country.name,
    subtitle: context.country.iso3,
    route: `/countries/${context.country.iso3}`,
    externalUrl: null,
    details: [
      { label: "ISO 3166-1 alpha-3", value: context.country.iso3 },
      { label: "Region label", value: context.country.region ?? "Not reported" },
    ],
  });
  addEdge({
    from: sourceRecordId,
    to: countryId,
    relation: "located-in",
    label: "Country context",
    evidenceKind: "source-field",
    sourceId: "peoplegroups-org-api",
    sourceRecordIds: [context.pgid],
    sourceFields: ["ISOalpha3", "Ctry"],
    semantics: "The PeopleGroups.org PGID record reports this country context. The edge is geographic source context, not a sovereignty or identity judgment.",
  });

  if (context.language.iso6393 || context.language.name) {
    const languageId = context.language.iso6393
      ? `language:${context.language.iso6393}`
      : `language-label:peoplegroups:${encoded(context.language.name ?? "unknown")}`;
    addNode({
      id: languageId,
      kind: "language",
      label: context.language.name ?? context.language.iso6393 ?? "Language unknown",
      subtitle: context.language.iso6393 ? `ISO 639-3 · ${context.language.iso6393.toUpperCase()}` : "Provider language label",
      route: context.language.iso6393 ? `/languages/${context.language.iso6393}` : null,
      externalUrl: null,
      details: [
        { label: "Family label", value: context.language.family ?? "Not reported" },
      ],
    });
    addEdge({
      from: sourceRecordId,
      to: languageId,
      relation: "primary-language-reported",
      label: "Primary language reported",
      evidenceKind: "source-field",
      sourceId: "peoplegroups-org-api",
      sourceRecordIds: [context.pgid],
      sourceFields: ["ROL", "Lang", "LangFamily"],
      semantics: "The source record reports this primary-language field. It does not prove monolingualism, bilingualism, dialect equivalence or mutual intelligibility with related languages.",
    });
  }

  if (context.religion.code || context.religion.name || context.religion.displayName) {
    const religionKey = context.religion.code ?? context.religion.name ?? context.religion.displayName ?? "unknown";
    const religionId = `religion:peoplegroups:${encoded(religionKey)}`;
    addNode({
      id: religionId,
      kind: "religion",
      label: context.religion.name ?? context.religion.displayName ?? context.religion.code ?? "Religion unknown",
      subtitle: context.religion.code ? `Source code · ${context.religion.code}` : "Provider religious-context label",
      route: null,
      externalUrl: null,
      details: context.religion.displayName
        ? [{ label: "Display label", value: context.religion.displayName }]
        : [],
    });
    addEdge({
      from: sourceRecordId,
      to: religionId,
      relation: "primary-religion-reported",
      label: "Primary religion reported",
      evidenceKind: "source-field",
      sourceId: "peoplegroups-org-api",
      sourceRecordIds: [context.pgid],
      sourceFields: ["ROR", "Rlgn", "RlgnDiv"],
      semantics: "The source reports an aggregate religious context for this PGID. It does not describe the beliefs or identity of every individual.",
    });
  }

  const assertion = context.reach.assertion;
  const classificationId = `mission-classification:peoplegroups:${context.pgid}`;
  addNode({
    id: classificationId,
    kind: "mission-classification",
    label: assertion.sourceLabel ?? (assertion.sourceCode === null ? "Mission classification unknown" : `GSEC ${assertion.sourceCode}`),
    subtitle: assertion.classification === "unreached"
      ? "Product mapping: unreached"
      : assertion.classification === "not-unreached"
        ? "Product mapping: does not meet source unreached rule"
        : "Product mapping: unknown",
    route: null,
    externalUrl: null,
    details: [
      { label: "Methodology", value: assertion.methodologyId },
      { label: "Definition", value: assertion.definition },
    ],
  });
  addEdge({
    from: sourceRecordId,
    to: classificationId,
    relation: "mission-classification-reported",
    label: "Mission classification",
    evidenceKind: "source-field",
    sourceId: assertion.sourceId,
    sourceRecordIds: [context.pgid],
    sourceFields: ["GSEC", "GSECbrf"],
    semantics: "This is a source-scoped IMB / PeopleGroups.org mission classification. It is not a universal or provider-independent verdict.",
  });

  const addResource = (
    key: "bible" | "jesus-film" | "total",
    label: string,
    value: string | number | null,
    relation: "bible-availability-reported" | "jesus-film-availability-reported" | "resource-total-reported",
    sourceFields: string[],
    semantics: string,
  ) => {
    if (value === null) return;
    const nodeId = `resource:peoplegroups:${context.pgid}:${key}`;
    addNode({
      id: nodeId,
      kind: "resource",
      label: `${label} · ${value}`,
      subtitle: "Source-reported resource indicator",
      route: null,
      externalUrl: null,
      details: [
        { label: "PGID", value: context.pgid },
        { label: "Raw value", value: String(value) },
      ],
    });
    addEdge({
      from: sourceRecordId,
      to: nodeId,
      relation,
      label,
      evidenceKind: "source-field",
      sourceId: "peoplegroups-org-api",
      sourceRecordIds: [context.pgid],
      sourceFields,
      semantics,
    });
  };

  addResource(
    "bible",
    "Bible availability",
    context.resources.bibleAvailability,
    "bible-availability-reported",
    ["Bible"],
    "This is the raw PeopleGroups.org Bible-availability label for the PGID. Unreached does not convert it into portions, New Testament, complete-Bible, dialect-fit, comprehension or actual-use claims.",
  );
  addResource(
    "jesus-film",
    "Jesus Film availability",
    context.resources.jesusFilmAvailability,
    "jesus-film-availability-reported",
    ["Jesus"],
    "This is the raw PeopleGroups.org Jesus Film availability label for the PGID. It does not prove local access, comprehension or use.",
  );
  addResource(
    "total",
    "Reported resource total",
    context.resources.totalReported,
    "resource-total-reported",
    ["ResTot"],
    "This is the provider's reported evangelical-resource total field. It is preserved as a source number and is not converted into a quality, completeness or priority score.",
  );

  const taxonomyEntries = [
    { key: "rop3", label: "ROP3 people name", value: context.taxonomy.peopleName, field: "PplNm" },
    { key: "cluster", label: "People cluster", value: context.taxonomy.peopleCluster, field: "PplClstr" },
    { key: "affinity", label: "Affinity bloc", value: context.taxonomy.affinityBloc, field: "Affbloc" },
    { key: "ethne", label: "Ethnographic group", value: context.taxonomy.ethnographicGroup, field: "Ethne" },
  ] as const;
  for (const item of taxonomyEntries) {
    if (!item.value) continue;
    const taxonomyId = `taxonomy:peoplegroups:${item.key}:${encoded(item.value)}`;
    addNode({
      id: taxonomyId,
      kind: "taxonomy",
      label: item.value,
      subtitle: item.label,
      route: null,
      externalUrl: null,
      details: [{ label: "Provider field", value: item.field }],
    });
    addEdge({
      from: sourceRecordId,
      to: taxonomyId,
      relation: "taxonomy-label-reported",
      label: item.label,
      evidenceKind: "source-taxonomy",
      sourceId: "peoplegroups-org-api",
      sourceRecordIds: [context.pgid],
      sourceFields: [item.field],
      semantics: "This node preserves an explicit PeopleGroups.org taxonomy label. The graph does not reinterpret the taxonomy as a universal ethnic, linguistic or political identity.",
    });
  }

  for (const item of related) {
    const relatedContext = item.entity.contexts[0]!;
    const relatedId = `people:peoplegroups:${item.entity.peid}`;
    addNode({
      id: relatedId,
      kind: "people",
      label: item.entity.displayName,
      subtitle: `PEID ${item.entity.peid} · ${relatedContext.country.name}`,
      route: `/peoples/${item.entity.routeKey}`,
      externalUrl: null,
      details: [
        { label: "PGID", value: relatedContext.pgid },
        { label: "Country", value: relatedContext.country.name },
      ],
    });
    addEdge({
      from: peopleId,
      to: relatedId,
      relation: "related-by-source-taxonomy",
      label: relationLabel(item.relationship),
      evidenceKind: "derived-source-relationship",
      sourceId: "peoplegroups-org-api",
      sourceRecordIds: [context.pgid, relatedContext.pgid],
      sourceFields: [relationField(item.relationship)],
      semantics: relationSemantics(item.relationship),
    });
  }

  if (editorial && editorial.tier !== "source") {
    const editorialId = editorial.id;
    addNode({
      id: editorialId,
      kind: "editorial-profile",
      label: editorial.title,
      subtitle: editorial.tier === "reviewed" ? "Reviewed editorial profile" : "Curated editorial profile",
      route: null,
      externalUrl: null,
      details: [
        { label: "Status", value: editorial.review.status },
        { label: "Reviewed", value: editorial.review.reviewedAt ?? "Not recorded" },
      ],
    });
    addEdge({
      from: peopleId,
      to: editorialId,
      relation: "has-reviewed-editorial",
      label: "Reviewed editorial context",
      evidenceKind: "reviewed-editorial",
      sourceId: "unreached-editorial",
      sourceRecordIds: [context.pgid],
      sourceFields: [],
      semantics: "This edge links the source-identified people record to separately authored Unreached editorial context. Editorial synthesis is not a PeopleGroups.org provider field.",
    });

    const sourceById = new Map(editorial.sources.map((source) => [source.id, source]));
    for (const claim of editorial.claims) {
      const claimId = `editorial-claim:${claim.id}`;
      addNode({
        id: claimId,
        kind: "editorial-claim",
        label: claim.text,
        subtitle: `${claim.kind} · evidence ${claim.evidenceLevel} · ${claim.certainty} certainty`,
        route: null,
        externalUrl: null,
        details: [
          { label: "Sections", value: claim.sectionKeys.join(", ") },
          { label: "Temporal class", value: claim.temporalClass },
        ],
      });
      addEdge({
        from: editorialId,
        to: claimId,
        relation: "contains-reviewed-claim",
        label: "Contains reviewed claim",
        evidenceKind: "reviewed-editorial",
        sourceId: "unreached-editorial",
        sourceRecordIds: [context.pgid],
        sourceFields: [],
        semantics: "This is a reviewed editorial claim stored separately from provider mission data. Its evidence is represented through citation edges.",
      });

      for (const citationId of claim.citationIds) {
        const source = sourceById.get(citationId);
        if (!source) continue;
        const sourceNodeId = `editorial-source:${source.id}`;
        addNode({
          id: sourceNodeId,
          kind: "editorial-source",
          label: source.title,
          subtitle: source.publisher ?? source.sourceType,
          route: null,
          externalUrl: source.url,
          details: [
            { label: "Source type", value: source.sourceType },
            { label: "Accessed", value: source.accessedAt },
          ],
        });
        addEdge({
          from: claimId,
          to: sourceNodeId,
          relation: "claim-cites-source",
          label: "Cites source",
          evidenceKind: "reviewed-editorial",
          sourceId: source.sourceId,
          sourceRecordIds: [],
          sourceFields: [],
          semantics: "This edge records the citation attached to a reviewed editorial claim. It does not imply that every sentence or interpretation in the profile comes directly from this source.",
        });
      }
    }
  }

  const nodeValues = [...nodes.values()];
  const edgeValues = [...edges.values()];
  const nodeIds = new Set(nodeValues.map((node) => node.id));
  for (const edge of edgeValues) {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
      throw new Error(`Knowledge graph edge references a missing node: ${edge.id}`);
    }
  }

  return missionKnowledgeGraphSchema.parse({
    schemaVersion: 1,
    focusNodeId: peopleId,
    nodes: nodeValues,
    edges: edgeValues,
    sourceIds: [...new Set(edgeValues.map((edge) => edge.sourceId).filter((value): value is string => Boolean(value)))].sort(),
    boundaries: [
      "Graph edges preserve their evidence layer; provider fields, derived source-taxonomy relationships and reviewed editorial claims are not merged into one confidence score.",
      "Absence of an edge means the current bounded graph does not have certified evidence for that relationship; it is not proof that no real-world relationship exists.",
      "Same taxonomy, language family, country context or source classification never implies stronger identity, intelligibility, bilingualism, causation or resource interchangeability.",
      "Joshua Project comparison remains an opt-in no-store Phase 13 surface and is not persisted or silently inserted into this graph.",
    ],
  });
}

export function knowledgeGraphNeighbors(graph: MissionKnowledgeGraph, nodeId: string): Array<{
  edge: KnowledgeGraphEdge;
  node: KnowledgeGraphNode;
  direction: "outgoing" | "incoming";
}> {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  return graph.edges.flatMap((edge) => {
    if (edge.from === nodeId) {
      const node = nodeById.get(edge.to);
      return node ? [{ edge, node, direction: "outgoing" as const }] : [];
    }
    if (edge.to === nodeId) {
      const node = nodeById.get(edge.from);
      return node ? [{ edge, node, direction: "incoming" as const }] : [];
    }
    return [];
  }).sort((a, b) =>
    a.edge.evidenceKind.localeCompare(b.edge.evidenceKind)
    || a.edge.label.localeCompare(b.edge.label)
    || a.node.label.localeCompare(b.node.label)
  );
}
