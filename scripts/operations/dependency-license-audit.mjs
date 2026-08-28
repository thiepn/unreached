import { readFile } from "node:fs/promises";

const lockfiles = ["package-lock.json", "worker/package-lock.json"];
const forbiddenLicense = /(?:^|[^A-Z])(AGPL|GPL(?:-|$)|SSPL|BUSL|COMMONS CLAUSE|POLYFORM|ELASTIC LICENSE)(?:[^A-Z]|$)/i;
const summaries = new Map();
const missing = [];
const forbidden = [];

for (const path of lockfiles) {
  const lock = JSON.parse(await readFile(path, "utf8"));
  if (lock.lockfileVersion !== 3 || !lock.packages || typeof lock.packages !== "object") {
    throw new Error(`${path} must be an npm lockfileVersion 3 package graph.`);
  }

  for (const [location, entry] of Object.entries(lock.packages)) {
    if (!location || !location.startsWith("node_modules/") || entry?.link) continue;
    const name = location.slice("node_modules/".length);
    const license = typeof entry.license === "string" ? entry.license.trim() : "";
    if (!license) {
      missing.push(`${path}: ${name}@${entry.version ?? "unknown"}`);
      continue;
    }
    if (forbiddenLicense.test(license)) forbidden.push(`${path}: ${name}@${entry.version ?? "unknown"} -> ${license}`);
    summaries.set(license, (summaries.get(license) ?? 0) + 1);
  }
}

if (missing.length) throw new Error(`Dependencies missing lockfile license metadata:\n${missing.join("\n")}`);
if (forbidden.length) throw new Error(`Dependencies require manual/restrictive license review:\n${forbidden.join("\n")}`);

console.log("Dependency license audit passed.");
for (const [license, count] of [...summaries.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
  console.log(`${String(count).padStart(3)}  ${license}`);
}
