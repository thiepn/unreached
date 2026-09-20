import { z } from "zod";

export const localeSchema = z.enum(["en", "de"]);
export type Locale = z.infer<typeof localeSchema>;

export const DEFAULT_LOCALE: Locale = "en";
export const SUPPORTED_LOCALES: readonly Locale[] = ["en", "de"] as const;

const messages = {
  en: {
    "shared.kicker": "Shared prayer collection",
    "shared.heading": "Pray together: {title}",
    "shared.intro": "This collection contains only public people identifiers chosen for shared prayer. It does not contain the sender's private notes, prayer history, account data, or prayer-list timestamps.",
    "shared.loading": "Loading current source records…",
    "shared.invalidHeading": "This prayer collection link is invalid.",
    "shared.invalidText": "The shared payload could not be verified. Ask the sender for a new link.",
    "shared.sourceUnavailableHeading": "Current source data is unavailable.",
    "shared.sourceUnavailableText": "The collection itself was read successfully, but current people records could not be checked.",
    "shared.peopleHeading": "People in this collection",
    "shared.peopleCount": "{count} current prayer-eligible people",
    "shared.pray": "Pray for this people",
    "shared.profile": "Open people profile",
    "shared.country": "Country",
    "shared.language": "Language",
    "shared.unavailableHeading": "Unavailable or changed records",
    "shared.unavailableText": "These IDs remain in the shared link, but the current source record is missing or no longer meets Prayer 3.0 eligibility. Unreached does not preserve an outdated prayer classification.",
    "shared.missing": "Current source record not found",
    "shared.ineligible": "Current source record is not classified GSEC 0–3",
    "shared.noneHeading": "No current prayer-eligible records remain.",
    "shared.noneText": "The collection is still valid, but none of its people IDs currently resolve to Prayer 3.0 eligible records.",
    "shared.privacyHeading": "What this link shares",
    "shared.privacyText": "Only the collection title, display language, payload version, and public PeopleGroups PEIDs are encoded in this link. Opening it creates no prayer score, public activity record, or automatic copy into your private prayer list.",
    "shared.sourceBoundary": "People names, countries, languages, and prayer eligibility are resolved from current PeopleGroups.org / IMB runtime data when this link is opened.",
    "shared.backPrayer": "Open Prayer",
    "shared.backAtlas": "Explore the atlas",
  },
  de: {
    "shared.kicker": "Geteilte Gebetsliste",
    "shared.heading": "Gemeinsam beten: {title}",
    "shared.intro": "Diese Liste enthält nur öffentliche Personenkennungen, die bewusst zum gemeinsamen Gebet ausgewählt wurden. Private Notizen, Gebetsverlauf, Kontodaten und Zeitstempel der persönlichen Gebetsliste werden nicht geteilt.",
    "shared.loading": "Aktuelle Quelldaten werden geladen…",
    "shared.invalidHeading": "Dieser Link zur Gebetsliste ist ungültig.",
    "shared.invalidText": "Die geteilten Daten konnten nicht verifiziert werden. Bitte den Absender um einen neuen Link.",
    "shared.sourceUnavailableHeading": "Aktuelle Quelldaten sind nicht verfügbar.",
    "shared.sourceUnavailableText": "Die Liste selbst wurde gelesen, aber die aktuellen Personendatensätze konnten nicht geprüft werden.",
    "shared.peopleHeading": "Menschen in dieser Gebetsliste",
    "shared.peopleCount": "{count} aktuell zum Gebet verfügbare Einträge",
    "shared.pray": "Für diese Menschen beten",
    "shared.profile": "Personenprofil öffnen",
    "shared.country": "Land",
    "shared.language": "Sprache",
    "shared.unavailableHeading": "Nicht verfügbare oder geänderte Einträge",
    "shared.unavailableText": "Diese Kennungen bleiben im geteilten Link enthalten, aber der aktuelle Quelldatensatz fehlt oder erfüllt die Voraussetzungen von Prayer 3.0 nicht mehr. Unreached bewahrt keine veraltete Gebetsklassifizierung.",
    "shared.missing": "Aktueller Quelldatensatz nicht gefunden",
    "shared.ineligible": "Aktueller Quelldatensatz ist nicht als GSEC 0–3 klassifiziert",
    "shared.noneHeading": "Keine aktuell zum Gebet verfügbaren Einträge.",
    "shared.noneText": "Die Liste ist weiterhin gültig, aber derzeit führt keine ihrer Personenkennungen zu einem für Prayer 3.0 verfügbaren Datensatz.",
    "shared.privacyHeading": "Was dieser Link teilt",
    "shared.privacyText": "In diesem Link werden nur Titel, Anzeigesprache, Payload-Version und öffentliche PeopleGroups-PEIDs gespeichert. Beim Öffnen entstehen weder Gebetspunkte noch ein öffentlicher Aktivitätsverlauf; außerdem wird nichts automatisch in die private Gebetsliste übernommen.",
    "shared.sourceBoundary": "Personennamen, Länder, Sprachen und Gebetsverfügbarkeit werden beim Öffnen aus den aktuellen PeopleGroups.org-/IMB-Laufzeitdaten aufgelöst.",
    "shared.backPrayer": "Gebetsbereich öffnen",
    "shared.backAtlas": "Atlas erkunden",
  },
} as const;

export type MessageKey = keyof typeof messages.en;

export function localeFromUnknown(value: unknown): Locale {
  if (typeof value !== "string") return DEFAULT_LOCALE;
  const language = value.trim().toLocaleLowerCase("en").split("-")[0] ?? "";
  return localeSchema.safeParse(language).success ? language as Locale : DEFAULT_LOCALE;
}

function interpolate(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key: string) => {
    const value = values[key];
    return value === undefined ? `{${key}}` : String(value);
  });
}

export function translate(locale: Locale, key: MessageKey, values: Readonly<Record<string, string | number>> = {}): string {
  return interpolate(messages[locale][key], values);
}

export function localeDisplayName(locale: Locale): string {
  return locale === "de" ? "Deutsch" : "English";
}

export function intlLocale(locale: Locale): string {
  return locale === "de" ? "de-DE" : "en-US";
}

export function catalogFor(locale: Locale): Readonly<Record<MessageKey, string>> {
  return messages[locale];
}
