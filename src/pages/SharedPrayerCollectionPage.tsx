import { AlertTriangle, ArrowRight, Compass, Database, Languages, LockKeyhole, UsersRound } from "lucide-preact";
import { useMemo } from "preact/hooks";

import { readHashSearchParams } from "../app/hash-state";
import { hrefFor } from "../app/router";
import { DEFAULT_LOCALE, translate, type Locale } from "../i18n";
import { useLivePrayerExperience } from "../prayer";
import {
  decodeSharedPrayerCollection,
  resolveSharedPrayerCollection,
  type UnavailableSharedPrayerPerson,
} from "../sharing";

function unavailableReason(locale: Locale, item: UnavailableSharedPrayerPerson): string {
  return translate(locale, item.reason === "missing" ? "shared.missing" : "shared.ineligible");
}

export function SharedPrayerCollectionPage() {
  const encoded = readHashSearchParams().get("c");
  const collection = useMemo(() => decodeSharedPrayerCollection(encoded), [encoded]);
  const locale = collection?.locale ?? DEFAULT_LOCALE;
  const prayer = useLivePrayerExperience(Boolean(collection));

  if (!collection) {
    return (
      <article class="shared-prayer-page shared-prayer-page--state" lang={locale} data-phase19-shared-prayer="invalid">
        <AlertTriangle size={26} aria-hidden="true" />
        <span class="eyebrow">{translate(locale, "shared.kicker")}</span>
        <h1>{translate(locale, "shared.invalidHeading")}</h1>
        <p>{translate(locale, "shared.invalidText")}</p>
        <a href={hrefFor("/pray")}>{translate(locale, "shared.backPrayer")}</a>
      </article>
    );
  }

  if (prayer.loading && !prayer.ready) {
    return (
      <article class="shared-prayer-page shared-prayer-page--state" lang={locale} data-phase19-shared-prayer="loading" role="status">
        <Database size={24} aria-hidden="true" />
        <p>{translate(locale, "shared.loading")}</p>
      </article>
    );
  }

  if (prayer.error && !prayer.ready) {
    return (
      <article class="shared-prayer-page shared-prayer-page--state" lang={locale} data-phase19-shared-prayer="source-error">
        <AlertTriangle size={26} aria-hidden="true" />
        <span class="eyebrow">{translate(locale, "shared.kicker")}</span>
        <h1>{translate(locale, "shared.sourceUnavailableHeading")}</h1>
        <p>{translate(locale, "shared.sourceUnavailableText")}</p>
      </article>
    );
  }

  const resolved = resolveSharedPrayerCollection(collection, prayer.peopleByPeid);

  return (
    <article class="shared-prayer-page" lang={locale} data-phase19-shared-prayer="ready" data-shared-locale={locale}>
      <header class="shared-prayer-page__hero">
        <div>
          <span class="eyebrow">{translate(locale, "shared.kicker")}</span>
          <h1>{translate(locale, "shared.heading", { title: collection.title })}</h1>
          <p>{translate(locale, "shared.intro")}</p>
        </div>
        <Compass size={34} aria-hidden="true" />
      </header>

      <section class="shared-prayer-page__privacy" aria-labelledby="shared-prayer-privacy-heading">
        <LockKeyhole size={18} aria-hidden="true" />
        <div>
          <h2 id="shared-prayer-privacy-heading">{translate(locale, "shared.privacyHeading")}</h2>
          <p>{translate(locale, "shared.privacyText")}</p>
        </div>
      </section>

      <section class="shared-prayer-page__people" aria-labelledby="shared-prayer-people-heading">
        <div class="shared-prayer-page__section-heading">
          <div>
            <span class="eyebrow">{translate(locale, "shared.peopleCount", { count: resolved.available.length })}</span>
            <h2 id="shared-prayer-people-heading">{translate(locale, "shared.peopleHeading")}</h2>
          </div>
          <UsersRound size={21} aria-hidden="true" />
        </div>

        {resolved.available.length ? (
          <div class="shared-prayer-page__grid">
            {resolved.available.map(({ entity }) => {
              const context = entity.contexts[0]!;
              return (
                <article class="shared-prayer-card" key={entity.peid} data-shared-prayer-peid={entity.peid}>
                  <span class="shared-prayer-card__source">PEID {entity.peid} · {context.pgid}</span>
                  <h3>{entity.displayName}</h3>
                  <dl>
                    <div><dt>{translate(locale, "shared.country")}</dt><dd>{context.country.name}</dd></div>
                    <div><dt>{translate(locale, "shared.language")}</dt><dd>{context.language.name ?? context.language.iso6393 ?? "—"}</dd></div>
                  </dl>
                  <div class="shared-prayer-card__actions">
                    <a href={hrefFor("/pray/" + entity.routeKey)}>{translate(locale, "shared.pray")} <ArrowRight size={14} aria-hidden="true" /></a>
                    <a href={hrefFor("/peoples/" + entity.routeKey)}>{translate(locale, "shared.profile")}</a>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div class="shared-prayer-page__empty">
            <h3>{translate(locale, "shared.noneHeading")}</h3>
            <p>{translate(locale, "shared.noneText")}</p>
          </div>
        )}
      </section>

      {resolved.unavailable.length ? (
        <section class="shared-prayer-page__unavailable" aria-labelledby="shared-prayer-unavailable-heading">
          <div class="shared-prayer-page__section-heading">
            <div>
              <span class="eyebrow">{resolved.unavailable.length}</span>
              <h2 id="shared-prayer-unavailable-heading">{translate(locale, "shared.unavailableHeading")}</h2>
            </div>
            <AlertTriangle size={20} aria-hidden="true" />
          </div>
          <p>{translate(locale, "shared.unavailableText")}</p>
          <ul>
            {resolved.unavailable.map((item) => <li key={item.sourcePeopleId}><strong>PEID {item.sourcePeopleId}</strong><span>{unavailableReason(locale, item)}</span></li>)}
          </ul>
        </section>
      ) : null}

      <footer class="shared-prayer-page__footer">
        <p><Database size={14} aria-hidden="true" /> {translate(locale, "shared.sourceBoundary")}</p>
        <div>
          <a href={hrefFor("/pray")}><Compass size={15} aria-hidden="true" /> {translate(locale, "shared.backPrayer")}</a>
          <a href={hrefFor("/regions")}><Languages size={15} aria-hidden="true" /> {translate(locale, "shared.backAtlas")}</a>
        </div>
      </footer>
    </article>
  );
}
