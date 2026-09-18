import { defineConfig } from "@playwright/test";

import baseConfig from "./playwright.config";

export default defineConfig(baseConfig, {
  // Phases 1–3 are data/source/editorial architecture and are certified by
  // build-time integrity gates. Browser contracts begin with the V3 visual
  // foundation in Phase 4 and automatically include later roadmap phases.
  testMatch: /v3-phase(?:[4-9]|1[0-9]|20)-.*\.spec\.ts/,
});
