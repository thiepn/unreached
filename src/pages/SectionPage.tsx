import type { ComponentType } from "preact";
import type { LucideProps } from "lucide-preact";
import { Bookmark, Compass, Globe2, Info, UsersRound } from "lucide-preact";

import { StatusChip } from "../components/StatusChip";

type SectionKind = "peoples" | "countries" | "pray" | "saved" | "about";

interface SectionDefinition {
  eyebrow: string;
  title: string;
  description: string;
  phase: string;
  phaseLabel: string;
  icon: ComponentType<LucideProps>;
  next: string[];
}

const definitions: Record<SectionKind, SectionDefinition> = {
  peoples: {
    eyebrow: "People Group Explorer",
    title: "Know the peoples behind the numbers.",
    description: "Profiles, filters, languages, gospel-access context, Scripture status, and related peoples will live here.",
    phase: "U6",
    phaseLabel: "People Group Explorer",
    icon: UsersRound,
    next: ["Search and filtering", "People profiles", "Related peoples"]
  },
  countries: {
    eyebrow: "Country Explorer",
    title: "Move from nations to peoples.",
    description: "Country-level mission summaries will connect the global map to the people groups living within each country.",
    phase: "U5",
    phaseLabel: "Country Explorer",
    icon: Globe2,
    next: ["Country profiles", "People rankings", "Mission overview"]
  },
  pray: {
    eyebrow: "Prayer",
    title: "Turn understanding into intercession.",
    description: "Focused prayer guides, People to Pray for Today, and country prayer experiences will be built here without competitive gamification.",
    phase: "U8",
    phaseLabel: "Prayer Experience",
    icon: Compass,
    next: ["Why pray?", "Prayer points", "Focused prayer mode"]
  },
  saved: {
    eyebrow: "Saved for Prayer",
    title: "Keep a local prayer list.",
    description: "Saved peoples will remain private to this browser. V1 requires no account, cloud profile, or public activity log.",
    phase: "U10",
    phaseLabel: "Local Personalization",
    icon: Bookmark,
    next: ["Local saves", "Recent exploration", "No account required"]
  },
  about: {
    eyebrow: "Methodology",
    title: "Know what the data means.",
    description: "Definitions, methodology, source attribution, data freshness, and uncertainty will be accessible from here.",
    phase: "U11",
    phaseLabel: "Release Transparency",
    icon: Info,
    next: ["Definitions", "Sources", "Data freshness"]
  }
};

export function SectionPage({ kind }: { kind: SectionKind }) {
  const section = definitions[kind];
  const Icon = section.icon;

  return (
    <section class="section-page">
      <div class="section-page__intro">
        <div class="section-icon" aria-hidden="true"><Icon size={24} /></div>
        <div class="eyebrow">{section.eyebrow}</div>
        <h1 class="display-title">{section.title}</h1>
        <p class="lead">{section.description}</p>
        <StatusChip tone="info">{section.phase} · {section.phaseLabel}</StatusChip>
      </div>

      <div class="section-page__rail" aria-label="Planned capabilities">
        <div class="rail-label">Planned capabilities</div>
        {section.next.map((item, index) => (
          <div class="rail-item" key={item}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{item}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
