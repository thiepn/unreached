# U10 — Search, Discovery & Local Personalization

## Purpose

U10 connects the atlas domains without introducing an account system. Discovery is global; personalization is deliberately local to the current browser.

## Global search

The header search button and `/` keyboard shortcut open a single search surface across:

- people groups
- countries
- languages

`Ctrl+K` / `Cmd+K` is also supported when focus is not already inside an editable control.

Search documents use stable destination keys and routes. The index is built from currently published browser datasets. Country geography falls back to the local Natural Earth feature inventory, so country search remains functional even while source-derived mission datasets are release-gated.

### Ranking

Search ranking prioritizes:

1. exact labels
2. label prefixes
3. label substrings
4. multi-token matches
5. aliases and related searchable metadata
6. limited subsequence typo tolerance

The result collector keeps only a small bounded result set instead of sorting every possible match after scoring. This keeps search suitable for the future full people/language dataset without adding a search dependency.

### Keyboard interaction

While the search input is focused:

- `ArrowDown` / `ArrowUp` move through results
- `Enter` opens the active result
- `Escape` closes search

Results are grouped visibly as Peoples, Countries and Languages while keyboard order remains deterministic across the ranked result list.

## Recent exploration

Detail visits are stored locally for:

- people profiles
- country profiles
- language profiles

Only the relevant domain loader is initialized for route tracking. Recent history is deduplicated by stable domain key and capped at 12 entries.

Recent history is visible in both global search and the Saved page.

## Save for Prayer

People profiles expose a local `Save for Prayer` control. The stored snapshot contains only enough information to keep the local list useful:

- stable source people ID
- people-group ID
- display name
- largest-country display name
- primary-language display name
- source classification/frontier state
- saved timestamp

The snapshot is not treated as authoritative mission data. The live people profile remains authoritative when published datasets change.

## Persistence

Storage key:

```text
unreached.personal.v1
```

The payload is schema-versioned and runtime-validated. Invalid or incompatible local data resets safely to an empty state rather than breaking the application.

No saved or recent activity is:

- uploaded
- synchronized
- associated with an account
- transmitted to analytics
- publicly displayed

Cross-tab updates use the browser `storage` event; same-tab updates use a local application event.

## Saved page

`#/saved` now contains:

- saved people groups
- direct links back to profiles
- direct links into focused prayer
- remove controls
- recent exploration
- clear-recent control
- empty states explaining how to save a people group

## Data publication boundaries

U10 does not weaken any U0–U9 publication gate. Search can only surface data already available to the browser. It does not access source APIs directly, bypass source permissions, or index hidden build-time source records.

## Deferred to U11

- production-scale performance profiling with full approved datasets
- deployment/browser/mobile smoke tests
- final accessibility audit and focus-trap refinement
- final persistence migration testing across release candidates
- final privacy/legal release review
