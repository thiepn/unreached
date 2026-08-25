import { readFile, writeFile } from "node:fs/promises";

const databaseId = process.env.D1_DATABASE_ID?.trim();
const accessAud = process.env.ACCESS_AUD?.trim();
if (!databaseId) throw new Error("D1_DATABASE_ID is required");
if (!accessAud) throw new Error("ACCESS_AUD is required");

const template = await readFile(new URL("./wrangler.template.jsonc", import.meta.url), "utf8");
const rendered = template
  .replaceAll("__D1_DATABASE_ID__", databaseId)
  .replaceAll("__ACCESS_AUD__", accessAud);
if (rendered.includes("__D1_DATABASE_ID__") || rendered.includes("__ACCESS_AUD__")) throw new Error("Wrangler template placeholders remain unresolved");
await writeFile(new URL("./wrangler.generated.jsonc", import.meta.url), rendered);
