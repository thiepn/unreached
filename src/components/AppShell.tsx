import type { ComponentChildren } from "preact";
import { useEffect, useState } from "preact/hooks";
import {
  Bookmark,
  ChevronDown,
  Compass,
  Globe2,
  Info,
  Languages,
  Map,
  Menu,
  Search,
  UsersRound,
} from "lucide-preact";

import { hrefFor, type RouteId } from "../app/router";
import { SearchDialog } from "./SearchDialog";

interface AppShellProps {
  activeRoute: RouteId;
  children: ComponentChildren;
}

interface NavItem {
  id: RouteId;
  label: string;
  path: string;
  icon: typeof Map;
  description?: string;
}

const primaryNav: NavItem[] = [
  { id: "explore", label: "Explore", path: "/", icon: Map },
  { id: "peoples", label: "Peoples", path: "/peoples", icon: UsersRound },
  { id: "pray", label: "Pray", path: "/pray", icon: Compass },
];

const browseNav: NavItem[] = [
  { id: "countries", label: "Countries", path: "/countries", icon: Globe2, description: "Browse mission context by nation" },
  { id: "languages", label: "Languages", path: "/languages", icon: Languages, description: "Explore language and resource records" },
  { id: "about", label: "About & sources", path: "/about", icon: Info, description: "Definitions, methodology and data policy" },
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <a
      class={`nav-link${active ? " is-active" : ""}`}
      href={hrefFor(item.path)}
      aria-current={active ? "page" : undefined}
    >
      <Icon size={17} aria-hidden="true" />
      <span>{item.label}</span>
    </a>
  );
}

function BrowseLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <a class={`browse-link${active ? " is-active" : ""}`} href={hrefFor(item.path)} aria-current={active ? "page" : undefined}>
      <Icon size={18} aria-hidden="true" />
      <span><strong>{item.label}</strong><small>{item.description}</small></span>
    </a>
  );
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
}

export function AppShell({ activeRoute, children }: AppShellProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const browseActive = browseNav.some((item) => item.id === activeRoute);

  useEffect(() => setBrowseOpen(false), [activeRoute]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && browseOpen) {
        setBrowseOpen(false);
        return;
      }
      if (isTypingTarget(event.target)) return;
      if (event.key === "/" || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k")) {
        event.preventDefault();
        setBrowseOpen(false);
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [browseOpen]);

  const openSearch = () => {
    setBrowseOpen(false);
    setSearchOpen(true);
  };

  return (
    <div class="site-shell">
      <a class="skip-link" href="#main-content">Skip to content</a>

      <header class="site-header">
        <a class="brand" href={hrefFor("/")} aria-label="Unreached home">
          <span class="brand-mark" aria-hidden="true">
            <span class="brand-mark__meridian" />
            <span class="brand-mark__parallel" />
          </span>
          <span class="brand-word">Unreached</span>
        </a>

        <nav class="desktop-nav" aria-label="Primary navigation">
          {primaryNav.map((item) => <NavLink key={item.id} item={item} active={activeRoute === item.id} />)}
          <div class="browse-menu">
            <button
              class={`browse-trigger${browseActive ? " is-active" : ""}`}
              type="button"
              aria-expanded={browseOpen}
              aria-controls="desktop-browse-menu"
              onClick={() => setBrowseOpen((open) => !open)}
            >
              <Menu size={17} aria-hidden="true" />
              <span>Browse</span>
              <ChevronDown size={14} aria-hidden="true" />
            </button>
            {browseOpen ? (
              <div id="desktop-browse-menu" class="browse-menu__panel">
                {browseNav.map((item) => <BrowseLink key={item.id} item={item} active={activeRoute === item.id} />)}
              </div>
            ) : null}
          </div>
        </nav>

        <div class="header-actions">
          <button
            class="icon-action utility-action search-action"
            type="button"
            aria-label="Search people, countries and languages"
            title="Search people, countries and languages (/)"
            onClick={openSearch}
          >
            <Search size={18} aria-hidden="true" />
            <span class="utility-action__label">Search</span>
            <kbd aria-hidden="true">/</kbd>
          </button>
          <a
            class={`icon-action utility-action${activeRoute === "saved" ? " is-active" : ""}`}
            href={hrefFor("/saved")}
            aria-label="Saved peoples"
            aria-current={activeRoute === "saved" ? "page" : undefined}
          >
            <Bookmark size={18} aria-hidden="true" />
            <span class="utility-action__label">Saved</span>
          </a>
        </div>
      </header>

      <main id="main-content" class="main-content" tabIndex={-1}>{children}</main>

      <nav class="mobile-nav" aria-label="Primary navigation">
        {primaryNav.map((item) => <NavLink key={item.id} item={item} active={activeRoute === item.id} />)}
        <button
          class={`nav-link mobile-browse-trigger${browseActive ? " is-active" : ""}`}
          type="button"
          aria-expanded={browseOpen}
          aria-controls="mobile-browse-menu"
          onClick={() => setBrowseOpen((open) => !open)}
        >
          <Menu size={17} aria-hidden="true" />
          <span>Browse</span>
        </button>
      </nav>

      {browseOpen ? (
        <div id="mobile-browse-menu" class="mobile-browse-sheet" aria-label="Browse more sections">
          <div class="mobile-browse-sheet__heading"><strong>Browse more</strong><button type="button" onClick={() => setBrowseOpen(false)}>Close</button></div>
          {browseNav.map((item) => <BrowseLink key={item.id} item={item} active={activeRoute === item.id} />)}
        </div>
      ) : null}

      {searchOpen ? <SearchDialog open onClose={() => setSearchOpen(false)} /> : null}
    </div>
  );
}
