import { existsSync } from "node:fs";

if (!existsSync("dist/index.html")) throw new Error("V3 Phase 20 dist certification requires dist/index.html.");
