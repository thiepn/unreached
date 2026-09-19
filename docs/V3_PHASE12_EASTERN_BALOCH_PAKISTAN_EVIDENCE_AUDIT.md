# Phase 12 Eastern Baloch of Pakistan Candidate - AI-Assisted Evidence Audit

**Status:** pre-review evidence audit only; not maintainer approval and not publication  
**Checked:** 19 September 2026  
**Candidate:** `data/v3/editorial/candidates/eastern-baloch-pakistan.json`

## Result

No material contradiction was found. The first automated live diagnostic found one display-name anchor mismatch only: the draft used `Baloch, Eastern` while the current API `NmDisp` is `Eastern Baloch`. PEID 6346, PGID PG006346, Pakistan, `bgp` and GSEC 1 all matched. The draft identity anchor was corrected to the exact live display name, and the subsequent live diagnostic passed the full identity and GSEC-scope checks.

## Evidence checked

- PeopleGroups.org currently identifies PG006346 as Eastern Baloch in Pakistan, with Balochi, Eastern (`bgp`), Sunni Islam, and GSEC 1 / less than 2% evangelical / no recent church-planting activity.
- The provider lists a JESUS film entry for Eastern Balochi and links Bible-resource providers.
- Glottolog identifies Eastern Balochi as `east2304` / `bgp`.
- Encyclopaedia Iranica identifies Baluchi as a Western Iranian language and describes Eastern Hill Baluchi as a distinct eastern dialect area.
- Iranica's broader ethnographic treatment documents substantial historical and tribal heterogeneity in Baluchistan rather than a single uniform Baluch identity.

## Guardrail

The candidate uses those independent references to resist overgeneralization. It does not convert regional ethnography into a claim that every Eastern Baloch community has identical history, language practice or social organization.

## Maintainer boundary

The cited source locators, current mission fields, source reuse and identity match still require accountable human review before publication.
