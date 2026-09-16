import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  adaptLegacyContextPackageToV3Editorial,
  assertEditorialProfileIntegrity,
  editorialExemplarManifestSchema,
} from "../../src/editorial/index.js";
import { editorialContextProfilePackageSchema } from "../../src/context/types.js";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");
const readJson = async <T>(path: string): Promise<T> => JSON.parse(await readText(path)) as T;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const manifest = editorialExemplarManifestSchema.parse(
  await readJson<unknown>("data/v3/editorial/exemplars.json"),
);

const profiles = [];
for (const entry of manifest.profiles) {
  const pkg = editorialContextProfilePackageSchema.parse(await readJson<unknown>(entry.sourceProfilePath));
  const profile = adaptLegacyContextPackageToV3Editorial(pkg, entry.sourceProfilePath);
  assertEditorialProfileIntegrity(profile, new Date("2026-09-16T20:30:00.000Z"));
  profiles.push(profile);
}

const cards = profiles.map((profile) => {
  const sections = profile.sections.map((section) => `
    <section>
      <h3>${escapeHtml(section.heading)}</h3>
      <p>${escapeHtml(section.body)}</p>
      <small>${escapeHtml(section.claimIds.join(", "))}</small>
    </section>`).join("\n");
  const prayer = profile.prayerPrompts.map((prompt) => `<li>${escapeHtml(prompt.text)}</li>`).join("\n");
  const gaps = profile.researchGaps.map((gap) => `<li><strong>${escapeHtml(gap.sectionKey)}</strong>: ${escapeHtml(gap.note)}</li>`).join("\n");
  return `
  <article>
    <header>
      <p class="eyebrow">${escapeHtml(profile.tier)} · ${escapeHtml(profile.peopleId)}</p>
      <h2>${escapeHtml(profile.title)}</h2>
      <p>${escapeHtml(profile.deck)}</p>
    </header>
    ${sections}
    <section><h3>Prayer</h3><ul>${prayer}</ul></section>
    <details><summary>Research gaps</summary><ul>${gaps}</ul></details>
    <details><summary>Sources</summary><ol>${profile.sources.map((source) => `<li>${escapeHtml(source.title)} — ${escapeHtml(source.url)}</li>`).join("\n")}</ol></details>
  </article>`;
}).join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Unreached V3 Phase 3 Editorial Preview</title>
<style>
body{font-family:system-ui,sans-serif;max-width:1080px;margin:0 auto;padding:32px;line-height:1.55;background:#f6f5f1;color:#1e2420}article{background:white;border:1px solid #d9d8d2;padding:32px;margin:24px 0}h1,h2,h3{line-height:1.15}.eyebrow,small{color:#606760}section{border-top:1px solid #ecebe7;padding-top:16px;margin-top:20px}details{margin-top:20px}code{font-family:ui-monospace,monospace}</style>
</head>
<body>
<h1>Unreached V3 — Phase 3 Editorial Preview</h1>
<p>Development-only preview of the ten reviewed seed profiles after adaptation to the V3 editorial contract. This file is not a production route.</p>
${cards}
</body>
</html>\n`;

const outDir = resolve(root, "artifacts/v3-phase3");
await mkdir(outDir, { recursive: true });
await writeFile(resolve(outDir, "editorial-preview.html"), html, "utf8");
await writeFile(resolve(outDir, "editorial-preview.json"), `${JSON.stringify(profiles, null, 2)}\n`, "utf8");
console.log(`Wrote ${profiles.length} reviewed editorial previews to artifacts/v3-phase3/.`);
