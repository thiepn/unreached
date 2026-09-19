import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

import { editorialProfileSchema } from "../../src/editorial/schemas";
import {
  buildMissionKnowledgeGraph,
  knowledgeGraphNeighbors,
} from "../../src/knowledge-graph/model";
import {
  buildRuntimePeopleEntities,
  relatedRuntimePeople,
  type PeopleGroupsApiRecord,
} from "../../src/providers/peoplegroups";

const root = process.cwd();
const read = (path: string) => readFile(resolve(root, path), "utf8");

function requireText(source: string, marker: string, label: string): void {
  if (!source.includes(marker)) throw new Error("V3 Phase 16: missing " + label + ": " + marker);
}

async function filesUnder(path: string): Promise<string[]> {
  const entries = await readdir(resolve(root, path), { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const child = path + "/" + entry.name;
    return entry.isDirectory() ? filesUnder(child) : [child];
  }));
  return nested.flat();
}

const records: PeopleGroupsApiRecord[] = [
  {
    PEID: 960001,
    PGID: "PG960001",
    NmDisp: "Graph Test People",
    ISOalpha3: "BEN",
    Ctry: "Benin",
    Pop: 120000,
    ROL: "fon",
    Lang: "Fon",
    LangFamily: "Niger-Congo",
    ROR: "R6",
    Rlgn: "Traditional Religion",
    RlgnDiv: "Traditional",
    GSEC: 2,
    GSECbrf: "Initial Church Planting",
    EvngLvl: "Less than 2%",
    Bible: "Available",
    Jesus: "Not Available",
    ResTot: 2,
    PplNm: "Graph Test People",
    PplClstr: "Graph Cluster",
    Affbloc: "Graph Affinity",
    Ethne: "Graph Ethne",
    UpdatedDate: "2026-09-20T00:00:00.000Z",
  },
  {
    PEID: 960002,
    PGID: "PG960002",
    NmDisp: "Graph Related People",
    ISOalpha3: "NGA",
    Ctry: "Nigeria",
    Pop: 80000,
    ROL: "fon",
    Lang: "Fon",
    LangFamily: "Niger-Congo",
    ROR: "R6",
    Rlgn: "Traditional Religion",
    GSEC: 5,
    GSECbrf: "Established",
    Bible: "Available",
    Jesus: "Available",
    ResTot: 4,
    PplNm: "Graph Test People",
    PplClstr: "Graph Cluster",
    Affbloc: "Graph Affinity",
    UpdatedDate: "2026-09-20T00:00:00.000Z",
  },
];

const entities = buildRuntimePeopleEntities(records);
const subject = entities.find((item) => item.peid === 960001);
if (!subject) throw new Error("Phase 16 synthetic subject record missing.");
const related = relatedRuntimePeople(subject, entities, 8);
if (related.length !== 1 || related[0]?.relationship !== "same-rop3-name") {
  throw new Error("Phase 16 synthetic taxonomy relationship setup failed.");
}

const editorial = editorialProfileSchema.parse({
  schemaVersion: 1,
  id: "editorial-profile:graph-test",
  tier: "reviewed",
  peopleId: "people:peoplegroups:960001",
  peopleContextIds: ["people-context:peoplegroups:pg960001"],
  title: "Graph Test People",
  deck: "Reviewed context used to certify Phase 16 evidence separation.",
  sections: [{
    key: "overview",
    heading: "Reviewed overview",
    body: "Reviewed body.",
    claimIds: ["claim:graph-test"],
  }],
  claims: [{
    id: "claim:graph-test",
    sectionKeys: ["overview"],
    kind: "fact",
    evidenceLevel: "A",
    certainty: "high",
    temporalClass: "stable",
    text: "Reviewed graph test claim.",
    citationIds: ["editorial-source:graph-test"],
    asOf: null,
    reviewAfter: null,
    sensitivity: "public",
    interpretationNote: null,
  }],
  sources: [{
    id: "editorial-source:graph-test",
    sourceId: "synthetic-academic-source",
    title: "Synthetic Academic Source",
    publisher: "Synthetic Publisher",
    url: "https://example.com/graph-source",
    sourceType: "academic",
    publicationDate: null,
    accessedAt: "2026-09-20T00:00:00.000Z",
    locator: null,
  }],
  prayerPrompts: [],
  researchGaps: [],
  legacyContextProfile: {
    sourcePath: "public/data/context/profiles/graph-test.json",
    legacyPeopleEntityId: "people-entity:peoplegroups:960001",
    peid: 960001,
  },
  review: {
    status: "published",
    reviewedAt: "2026-09-20T00:00:00.000Z",
    reviewerRole: "Maintainer",
    aiAssisted: true,
    checklist: {
      identityChecked: true,
      materialClaimsCited: true,
      currentClaimsFresh: true,
      sourceQualityChecked: true,
      noStereotypeShortcuts: true,
      religionNuanced: true,
      sensitiveDataChecked: true,
      licensingChecked: true,
      sectionCoverageChecked: true,
      prayerLanguageChecked: true,
    },
  },
});

const graph = buildMissionKnowledgeGraph(subject, related, editorial);
const nodeIds = new Set(graph.nodes.map((node) => node.id));
if (nodeIds.size !== graph.nodes.length) throw new Error("Phase 16 graph node IDs must be unique.");
if (new Set(graph.edges.map((edge) => edge.id)).size !== graph.edges.length) throw new Error("Phase 16 graph edge IDs must be unique.");
for (const edge of graph.edges) {
  if (edge.from === edge.to) throw new Error("Phase 16 graph contains a self-edge: " + edge.id);
  if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) throw new Error("Phase 16 graph contains a dangling edge: " + edge.id);
}

for (const kind of [
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
] as const) {
  if (!graph.nodes.some((node) => node.kind === kind)) throw new Error("Phase 16 graph missing node kind: " + kind);
}

const relatedEdge = graph.edges.find((edge) => edge.relation === "related-by-source-taxonomy");
if (!relatedEdge || relatedEdge.sourceFields.join(",") !== "PplNm") throw new Error("Phase 16 related edge must retain matching taxonomy field.");
if (relatedEdge.sourceRecordIds.sort().join(",") !== "PG960001,PG960002") throw new Error("Phase 16 related edge must retain both PGIDs.");

const bibleEdge = graph.edges.find((edge) => edge.relation === "bible-availability-reported");
if (!bibleEdge || bibleEdge.sourceFields.join(",") !== "Bible" || bibleEdge.evidenceKind !== "source-field") {
  throw new Error("Phase 16 Bible edge must remain a raw source-field relationship.");
}

const claimEdge = graph.edges.find((edge) => edge.relation === "contains-reviewed-claim");
const citationEdge = graph.edges.find((edge) => edge.relation === "claim-cites-source");
if (!claimEdge || !citationEdge || claimEdge.evidenceKind !== "reviewed-editorial" || citationEdge.evidenceKind !== "reviewed-editorial") {
  throw new Error("Phase 16 editorial claim/citation edges must remain reviewed-editorial evidence.");
}

if (graph.sourceIds.includes("joshua-project-api")) throw new Error("Phase 16 must not silently insert no-store Joshua Project comparison data.");
for (const forbidden of ["similarity", "embedding", "score", "ranked"] as const) {
  if (graph.edges.some((edge) => edge.relation.includes(forbidden as never))) throw new Error("Phase 16 graph leaked forbidden relation semantics: " + forbidden);
}

const centerNeighbors = knowledgeGraphNeighbors(graph, graph.focusNodeId);
if (!centerNeighbors.some((item) => item.edge.relation === "has-source-record")) throw new Error("Phase 16 center node must expose its PGID source record.");
if (!centerNeighbors.some((item) => item.edge.relation === "related-by-source-taxonomy")) throw new Error("Phase 16 center node must expose explicit related source records.");
if (!centerNeighbors.some((item) => item.edge.relation === "has-reviewed-editorial")) throw new Error("Phase 16 center node must expose reviewed editorial separately.");

for (const path of [
  "src/knowledge-graph/model.ts",
  "src/components/MissionKnowledgeGraphPanel.tsx",
  "src/styles/people/knowledge-graph.css",
  "docs/V3_PHASE16_MISSION_KNOWLEDGE_GRAPH.md",
  "tests/e2e/v3-phase16-knowledge-graph.spec.ts",
  ".github/workflows/v3-phase16-mission-knowledge-graph.yml",
]) {
  if (!existsSync(resolve(root, path))) throw new Error("V3 Phase 16 required file is missing: " + path);
}

const model = await read("src/knowledge-graph/model.ts");
for (const marker of [
  "sourceRecordIds",
  "sourceFields",
  "derived-source-relationship",
  "reviewed-editorial",
  "Same ROP3 people name",
  "Joshua Project comparison remains an opt-in no-store",
]) requireText(model, marker, "typed graph model");
for (const forbidden of ["cosineSimilarity", "embeddingDistance", "priorityScore", "graphRank"]) {
  if (model.includes(forbidden)) throw new Error("Phase 16 graph model contains forbidden hidden ranking/similarity mechanism: " + forbidden);
}

const panel = await read("src/components/MissionKnowledgeGraphPanel.tsx");
for (const marker of [
  "Mission knowledge graph",
  "not a similarity engine",
  "Connections do not become stronger by appearing in the graph.",
  "Why this connection exists",
  "Graph boundaries & interpretation",
  "data-phase16-knowledge-graph",
]) requireText(panel, marker, "knowledge graph UI");
if (panel.includes("Phase 16")) throw new Error("Public knowledge graph UI must not expose internal roadmap numbering.");

const page = await read("src/pages/PeoplePage.tsx");
requireText(page, "<MissionKnowledgeGraphPanel record={record} related={related} editorial={publishedEditorial} />", "people-profile graph integration");

const main = await read("src/main.tsx");
requireText(main, 'import "./styles/people/knowledge-graph.css";', "knowledge graph stylesheet import");

const about = await read("src/pages/AboutPage.tsx");
for (const marker of [
  "Mission knowledge graph",
  "Graph edges retain provenance.",
  "hidden similarity scores",
  "missing edges as proof of absence",
]) requireText(about, marker, "public graph methodology disclosure");

const docs = await read("docs/V3_PHASE16_MISSION_KNOWLEDGE_GRAPH.md");
for (const marker of [
  "Gate D",
  "Derived source relationships",
  "Reviewed editorial evidence",
  "no D1 schema",
  "hidden similarity",
]) requireText(docs, marker, "Phase 16 documentation");

const legal = await read("docs/DATA_AND_LEGAL_POLICY.md");
for (const marker of [
  "Phase 16 mission knowledge graph",
  "DERIVED IN-MEMORY EVIDENCE GRAPH ONLY",
  "embedding",
  "persisting or silently graphing Joshua Project",
]) requireText(legal, marker, "Phase 16 legal policy");

for (const directory of ["src/sync", "worker/src"]) {
  const files = await filesUnder(directory);
  for (const path of files.filter((item) => /\.(ts|tsx)$/.test(item))) {
    const source = await read(path);
    if (source.includes("mission-knowledge-graph") || source.includes("knowledgeGraphNode")) {
      throw new Error("Phase 16 graph must not enter persistence/sync boundary: " + path);
    }
  }
}

const pkg = await read("package.json");
requireText(pkg, '"v3:phase16-check": "tsx scripts/v3/phase16-check.ts"', "Phase 16 package gate");
requireText(pkg, "npm run v3:phase15-check && npm run v3:phase16-check", "blocking Phase 16 build integration");
requireText(pkg, '"v3:phase16-visual": "playwright test tests/e2e/v3-phase16-knowledge-graph.spec.ts --project=chromium --project=mobile-chromium --workers=1"', "Phase 16 visual gate");

console.log("V3 Phase 16 Mission Knowledge Graph checks passed: typed nodes and edges are deterministic and non-dangling, direct fields/taxonomy/derived relationships/editorial evidence remain separate, exact PGID/source-field provenance is retained, hidden similarity/ranking is absent, Joshua Project no-store data is excluded, and the graph adds no persistence or sync surface.");
