import { Check, Copy, Link2, Share2 } from "lucide-preact";
import { useEffect, useMemo, useState } from "preact/hooks";

import { localeDisplayName, SUPPORTED_LOCALES, type Locale } from "../i18n";
import type { PrayerListEntry } from "../personalization/types";
import {
  absoluteSharedPrayerCollectionUrl,
  createSharedPrayerCollection,
  MAX_SHARED_PRAYER_PEOPLE,
} from "../sharing";

export function ChurchPrayerSharePanel({ prayerList }: { prayerList: readonly PrayerListEntry[] }) {
  const prayerListKey = prayerList.map((entry) => entry.sourcePeopleId).join(",");
  const [title, setTitle] = useState("Church prayer collection");
  const [locale, setLocale] = useState<Locale>("en");
  const [selected, setSelected] = useState<number[]>(() => prayerList.slice(0, MAX_SHARED_PRAYER_PEOPLE).map((entry) => entry.sourcePeopleId));
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const allowed = new Set(prayerList.map((entry) => entry.sourcePeopleId));
    setSelected((current) => {
      const retained = current.filter((id) => allowed.has(id));
      return retained.length ? retained : prayerList.slice(0, MAX_SHARED_PRAYER_PEOPLE).map((entry) => entry.sourcePeopleId);
    });
  }, [prayerListKey]);

  useEffect(() => {
    setGeneratedUrl("");
    setCopied(false);
  }, [title, locale, selected.join(",")]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const toggle = (sourcePeopleId: number) => {
    setSelected((current) => current.includes(sourcePeopleId)
      ? current.filter((id) => id !== sourcePeopleId)
      : current.length < MAX_SHARED_PRAYER_PEOPLE
        ? [...current, sourcePeopleId]
        : current);
  };

  const generate = () => {
    const collection = createSharedPrayerCollection({
      prayerList,
      selectedPeopleIds: selected,
      title,
      locale,
    });
    setGeneratedUrl(absoluteSharedPrayerCollectionUrl(collection, window.location));
  };

  const copy = async () => {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section class="church-prayer-share" aria-labelledby="church-prayer-share-heading" data-phase19-church-share="true">
      <div class="church-prayer-share__heading">
        <div>
          <span class="v3-memory-eyebrow">Church sharing</span>
          <h3 id="church-prayer-share-heading">Create a privacy-safe prayer collection.</h3>
          <p>Choose up to {MAX_SHARED_PRAYER_PEOPLE} people from your prayer list. The link contains only its title, language, version, and public PeopleGroups PEIDs—not your notes, prayer history, account, or timestamps.</p>
        </div>
        <Share2 size={20} aria-hidden="true" />
      </div>

      {prayerList.length ? (
        <>
          <div class="church-prayer-share__settings">
            <label>
              <span>Collection title</span>
              <input
                type="text"
                maxlength={80}
                value={title}
                onInput={(event) => setTitle(event.currentTarget.value)}
              />
            </label>
            <label>
              <span>Recipient language</span>
              <select value={locale} onChange={(event) => setLocale(event.currentTarget.value as Locale)}>
                {SUPPORTED_LOCALES.map((item) => <option value={item} key={item}>{localeDisplayName(item)}</option>)}
              </select>
            </label>
          </div>

          <fieldset class="church-prayer-share__people">
            <legend>People to include · {selected.length}/{MAX_SHARED_PRAYER_PEOPLE}</legend>
            {prayerList.map((entry) => {
              const checked = selectedSet.has(entry.sourcePeopleId);
              return (
              <label key={entry.sourcePeopleId}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={!checked && selected.length >= MAX_SHARED_PRAYER_PEOPLE}
                  onChange={() => toggle(entry.sourcePeopleId)}
                />
                <span><strong>{entry.name}</strong><small>{[entry.countryName, entry.languageName].filter(Boolean).join(" · ") || ("PEID " + entry.sourcePeopleId)}</small></span>
              </label>
              );
            })}
          </fieldset>

          <button
            type="button"
            class="church-prayer-share__generate"
            disabled={!selected.length || !title.trim()}
            onClick={generate}
          >
            <Link2 size={16} aria-hidden="true" /> Generate share link
          </button>

          {generatedUrl ? (
            <div class="church-prayer-share__result" role="status">
              <label>
                <span>Share link</span>
                <input aria-label="Generated prayer collection share link" readonly value={generatedUrl} />
              </label>
              <button type="button" onClick={copy}>
                {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
          ) : null}

          <details class="church-prayer-share__privacy">
            <summary>Exactly what is shared</summary>
            <p>The encoded payload contains no people names, countries, languages, personal notes, prayer timestamps, prayer memory, Saved state, email address, account identifier, or sync revision. Recipients resolve the public PEIDs against current live source data when they open the link.</p>
          </details>
        </>
      ) : (
        <p class="church-prayer-share__empty">Add people to your private prayer list before creating a church prayer collection.</p>
      )}
    </section>
  );
}
