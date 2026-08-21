# People Group Display Rules

These rules govern U6 people-group browsing and profile presentation.

## 1. Global vs country-specific values

A global people-group record and a people-group-in-country record are different entities.

- global population is labeled as global population
- country population is labeled by country context
- global Christian/Evangelical percentages come from the global record
- local percentages stay inside the relevant country row

Never substitute one scope for the other without labeling it.

## 2. Unknown is not zero

`null` means unavailable/unknown.

The UI must display `Unknown` rather than `0`, `0%`, `No`, or an equivalent negative claim unless the normalized source value is actually zero/false.

## 3. Data quality

Population and percentage metrics preserve `exact`, `estimated`, `rounded`, or `unknown` quality metadata.

Where practical, profile UI shows the quality label near the metric. A quality label is not a confidence score.

## 4. Unreached and frontier

Use the normalized source classifications retained by U2.

Do not recalculate edge cases from percentages in the UI.

`Frontier` may be shown as the stronger badge when both frontier and unreached apply.

## 5. Religion

`Primary religion` means the source people-group classification. It is not a statement that every individual follows that religion.

Country-context religion values remain attached to the corresponding country record.

## 6. Language

The profile-level primary language comes from the global source record when resolvable.

Country contexts may report a different local language value. Do not overwrite the global field with a country-specific field.

## 7. Scripture and media

Always show the basis used for profile-level Scripture status.

`hasAudioRecordings: false` or `hasJesusFilm: false` means the source did not report that resource as available under the normalized field; avoid stronger wording such as `does not exist`.

## 8. Locations

General source location text can be displayed.

Do not display raw source coordinates by default. Coordinate existence may be retained internally for later cartographic work.

Do not use people-group location data to expose underground churches, workers, converts or sensitive ministry sites.

## 9. Related groups

Related groups in U6 mean shared source taxonomy only.

The UI must disclose whether the match is:

- same source cluster
- same affinity bloc

Never imply that this is a definitive ethnographic relationship.

## 10. Provenance

Profiles must retain source IDs and expose field-level provenance. Transformations should be visible when supplied.

A generic `Sources` footer is not a substitute for provenance when provenance data exists.

## 11. Release gate

Synthetic fixtures are for validation only and must never appear as real people-group content in production.

Until approved source-derived browser redistribution is available, the production People Explorer must show a transparent unavailable state rather than sample/fake people groups.
