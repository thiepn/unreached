# Phase 12 Nateni Candidate - AI-Assisted Evidence Audit

**Status:** pre-review evidence audit only; not maintainer approval and not publication  
**Checked:** 19 September 2026  
**Candidate:** `data/v3/editorial/candidates/nateni-benin.json`

## Result

No material contradiction was found between the candidate's seven claims and the four cited source surfaces checked on 19 September 2026. The candidate remains a draft because the review contract still requires an accountable maintainer to inspect the evidence and explicitly attest the publication checklist.

## Evidence checked

- PeopleGroups.org still uses PG012345 / PEID 12345 as its Nateni of Benin API example, with Nateni (ntm), GSEC 1, evangelical/resource fields and the Benin country context.
- Glottolog 5.3 still identifies Nateni as ISO 639-3 ntm in Benin.
- SIL Togo-Benin still publishes the 2014 57-page anthropology work on Natemba communities in north-western Benin and associates it with Nateni (ntm).
- The Government of Benin article from 9 February 2018 still lists nateni among the eleven literacy languages used at launch and says teaching materials were already available in those languages.

## Maintainer boundary

The source audit is an AI-assisted pre-review aid only. Before publication, the maintainer must still attest naming/identity, claim support, freshness, stereotype avoidance, religion nuance, sensitive-data handling, licensing/attribution, and the intentional omission of unsupported dimensions.

Generate the current live identity packet with:

`npm run v3:phase12-review-candidate -- --candidate=nateni-benin.json`
