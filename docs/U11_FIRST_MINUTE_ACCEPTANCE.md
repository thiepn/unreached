# U11 — First-Minute Newcomer Acceptance

## Status

This document defines the final human acceptance gate for the comprehension-first UX redesign.

Automated checks may certify navigation, progressive disclosure, source-truth preservation, responsive containment, and accessibility mechanics. They **do not** certify that a real newcomer understands the product. That claim requires observed human testing.

## Governing question

Can a person with no prior missions-data vocabulary understand what the app is for, what “unreached” means, find a people group, understand the few facts that matter, and begin praying without first learning GSEC, PEID, PGID, coverage denominators, or provider taxonomy?

## First-minute contract

A first-time visitor should be able to discover, in this order:

1. **Purpose** — this app helps them learn about unreached peoples and pray for them.
2. **Meaning** — “unreached” is explained in ordinary language before the GSEC code is shown.
3. **Exploration** — they can search/select a country or browse peoples without understanding the data model.
4. **Human context** — a people profile begins with identity, why the record is marked unreached, and four essential facts.
5. **Action** — prayer is a primary path, including a direct **Pray today** entry from Explore.
6. **Research on demand** — exact source classifications, IDs, denominators, coverage and methodology remain available but do not block the first five tasks.

## Automated pre-human gate

The automated suite should verify at minimum:

- Explore exposes **What does “unreached” mean?** on desktop and inside the mobile map sheet.
- The plain-language meaning appears before the GSEC 0–3 implementation detail when the explanation is opened.
- GSEC detail is not visible while the explanation is collapsed.
- Explore exposes **Pray today** and it reaches the daily prayer surface.
- the default map remains the plain-language unreached-population view.
- research map views remain opt-in.
- the constrained desktop Explore sidebar remains contained and usable.
- people-profile hero/essential facts do not expose PEID, PGID, or GSEC.
- the people profile has a visible prayer action.
- country first view contains exactly three primary metrics.
- people cards do not expose PEID, PGID, or GSEC.
- technical source data remains reachable through detailed disclosures.

The dedicated newcomer browser contract is `tests/e2e/u11-first-minute-acceptance.spec.ts`.

## Human test protocol

Use at least **5 participants** who are comfortable using normal websites but do not already know GSEC/PEID/PGID or routinely work with missions datasets.

Do not explain the interface before the test. Do not define “unreached” for participants. Ask them to think aloud where practical.

### Task 1 — Understand the product

Starting from Explore, ask:

> What do you think this website is for?

Pass when the participant independently identifies both **learning/exploring peoples** and **prayer** as core purposes.

### Task 2 — Explain “unreached”

Ask:

> In your own words, what does “unreached” mean here?

Pass when the participant can give a materially correct plain-language explanation without needing to define GSEC.

Fail if they interpret the label as a statement about a people’s worth, morality, intelligence, or personal sincerity.

### Task 3 — Find and understand one people

Ask the participant to find any unreached people and then answer:

- What country are they represented in?
- Approximately how many people are represented by the source record?
- What is the primary religion?
- What is the primary language?
- What does the Bible-resource value mean?

Pass when the participant can answer from the normal people-profile flow without opening detailed research data.

### Task 4 — Explain why the record is marked unreached

Ask:

> Why does this app mark this people group as unreached?

Pass when the participant uses the visible explanation and does not need to understand the underlying GSEC code.

### Task 5 — Begin prayer

Ask:

> Now pray for this people using the app.

Pass when the participant reaches the prayer guide without coaching.

Also test a fresh start from Explore and ask the participant to find a way to pray immediately. **Pray today** or the primary Pray navigation both count.

### Task 6 — Find technical source data

Ask:

> If you were researching this record, where would you look for the exact source classification and identifiers?

Pass when the participant can locate the detailed-data/source disclosure.

This task intentionally comes last. Success on Tasks 1–5 must not depend on completing Task 6.

## Acceptance thresholds

U11 human acceptance passes when all of the following are true:

- at least **4 of 5** participants complete Tasks 1–5 without coaching;
- at least **4 of 5** explain “unreached” materially correctly;
- no participant needs to understand GSEC, PEID, PGID, source coverage, or denominators to complete Tasks 1–5;
- median time from first load to a materially correct explanation of “unreached” is **under 60 seconds**;
- at least **4 of 5** can reach prayer without coaching;
- at least **4 of 5** can later find detailed source data when explicitly asked;
- no repeated critical misunderstanding is observed across two or more participants.

## Observation sheet

For each participant record:

| Measure | Result |
| --- | --- |
| Product purpose understood | Pass / Fail |
| “Unreached” explained correctly | Pass / Fail |
| Time to correct meaning | seconds |
| People found without coaching | Pass / Fail |
| Four essential facts found | Pass / Fail |
| Why-unreached explanation found | Pass / Fail |
| Prayer reached without coaching | Pass / Fail |
| Technical source data found when asked | Pass / Fail |
| Terms that caused confusion | notes |
| Wrong assumptions made | notes |
| Places participant hesitated | notes |

## Severity rules

Treat findings as follows:

- **Blocking:** participant cannot understand what the app is for, cannot determine what “unreached” means, or cannot reach prayer.
- **High:** repeated confusion about a primary fact or misleading interpretation of a source-backed value.
- **Medium:** unnecessary friction, unclear label, or hesitation that does not prevent task completion.
- **Low:** cosmetic preference with no measurable comprehension/navigation effect.

Do not redesign from isolated taste feedback. Prioritize repeated comprehension failures and observable task friction.

## Definition of final U11 completion

Automated certification plus this protocol prepares U11 for release, but **human comprehension certification is complete only after the participant results meet the thresholds above**.
