# U12 — Production Data Activation Release Gates

**Phase:** Production Data Activation  
**Current subphase:** U12A — Provider Foundation & Semantic Isolation  
**Status:** build-certified; browser certification pending

## U12A — provider foundation

- [x] PeopleGroups.org public API identified as a candidate real-data provider.
- [x] Official API use cases and field reference reviewed.
- [x] Source registered independently from Joshua Project.
- [x] Development ingestion is permitted by the machine-readable source policy.
- [x] Public release remains blocked pending exact release-mode review.
- [x] Static browser redistribution remains blocked pending exact redistribution/caching review.
- [x] Raw PeopleGroups.org record schema added.
- [x] Staging adapter preserves `PGID` and `PEID` separately.
- [x] IMB `GSEC`, `SPI`, `LPI` and evangelical-level fields remain source-specific.
- [x] Adapter does not fabricate Joshua Project `JPScale` or `Frontier` values.
- [x] Generic Bible availability is not converted into translation-completeness status.
- [x] Population remains explicitly estimated.
- [x] Invalid coordinates fail closed.
- [x] External photo references remain non-redistributable by default.
- [x] Source `UpdatedDate` and field-level provenance are retained.
- [x] Fixture-based semantic regression check added to the production build chain.
- [x] application TypeScript passes on the U12A branch.
- [x] script TypeScript passes on the U12A branch.
- [x] full U2–U11 validation chain still passes.
- [x] U12 PeopleGroups.org semantic check passes.
- [x] Vite production build passes.
- [ ] Browser Certification remains green.

### Automated evidence

Corrected U12A implementation head before this documentation update: `e3dd53676827b1064c11c5aff7fe9d61799a3d1d`.

- Unreached CI — run `32592895772` / #235 — **success**
- build job `97079354188` — **success**
- `Typecheck, policy checks and production build` step — **success**
- Browser Certification — run `32592895723` / #69 — pending when this evidence was recorded

## U12B — runtime / publication activation

U12B must not begin by simply flipping the source registry gates. It requires a deliberate publication architecture.

- [ ] Confirm whether direct browser API reads are the selected production mode.
- [ ] Confirm browser CORS behavior from the deployed production origin.
- [ ] Confirm rate-limit/reliability expectations and define failure behavior.
- [ ] Confirm whether a generated static snapshot is permitted; keep it disabled otherwise.
- [ ] Define canonical identity migration across `PGID`, `PEID` and existing people routes.
- [ ] Define source-neutral mission classification without collapsing provider methodologies.
- [ ] Define country aggregation, denominator and coverage semantics.
- [ ] Define source-backed language/religion normalization.
- [ ] Define editorial-text publication treatment under the U7 review standard.
- [ ] Keep third-party image publication independently rights-gated.
- [ ] Add runtime schema-change detection and fail-closed states.
- [ ] Add real-data performance budgets and search profiling.
- [ ] Add live/deployed browser certification for the selected data mode.
- [ ] Update production status files only after every applicable gate passes.

## U12C — production content certification

After U12B activates a legally and technically valid source mode:

- [ ] Real people-group discovery is populated in production.
- [ ] Real country mission summaries carry explicit coverage/source semantics.
- [ ] Real people profiles preserve country contexts and source provenance.
- [ ] Language/resource information is not overstated beyond source meaning.
- [ ] Prayer surfaces use only reviewed prompts and source-grounded context.
- [ ] Search and Saved work against the activated real-data corpus.
- [ ] No fixture dataset is reachable from the production browser.
- [ ] No restricted Joshua Project/ProgressBible/Ethnologue content leaks into the public artifact.
- [ ] Deployed desktop/mobile certification passes.
- [ ] Final data/source/attribution audit passes.

## Promotion rule

U12A may merge when the existing release chain plus the new PeopleGroups.org semantic check is green and Browser Certification remains green.

**U12A does not authorize production data activation.** U12B must explicitly satisfy the source-mode, identity, methodology, reliability and publication gates before real PeopleGroups.org records are enabled in the public application.
