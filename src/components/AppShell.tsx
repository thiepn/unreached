import type { ComponentChildren } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import {
  Bookmark,
  BookOpenText,
  ChevronDown,
  Compass,
  Globe2,
  Info,
  Languages,
  Map,
  Menu,
  Search,
  UserRound,
  UsersRound,
  X,
} from "lucide-preact";

import { hrefFor, type RouteId } from "../app/router";
import { DataStatus } from "./DataStatus";
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

type BrowseSurface = "desktop" | "mobile" | null;

const primaryNav: NavItem[] = [
  { id: "explore", label: "Explore", path: "/", icon: Map },
  { id: "peoples", label: "Peoples", path: "/peoples", icon: UsersRound },
  { id: "pray", label: "Pray", path: "/pray", icon: Compass },
];

const discoverNav: NavItem[] = [
  { id: "coverage", label: "Reviewed coverage", path: "/coverage", icon: BookOpenText, description: "People records with deeper, cited contextual articles" },
  { id: "countries", label: "Countries", path: "/countries", icon: Globe2, description: "Browse mission context by country" },
  { id: "languages", label: "Languages", path: "/languages", icon: Languages, description: "Explore languages and reported resource labels" },
];

const referenceNav: NavItem[] = [
  { id: "about", label: "About & sources", path: "/about", icon: Info, description: "Definitions, methodology, sources and data policy" },
];

const browseNav = [...discoverNav, ...referenceNav];

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

function BrowseLink({ item, active, initial = false }: { item: NavItem; active: boolean; initial?: boolean }) {
  const Icon = item.icon;
  return (
    <a
      class={`browse-link${active ? " is-active" : ""}`}
      href={hrefFor(item.path)}
      aria-current={active ? "page" : undefined}
      data-mobile-nav-initial={initial ? "true" : undefined}
    >
      <Icon size={18} aria-hidden="true" />
      <span><strong>{item.label}</strong><small>{item.description}</small></span>
    </a>
  );
}

function BrowseGroup({ label, items, activeRoute, mobile = false }: { label: string; items: NavItem[]; activeRoute: RouteId; mobile?: boolean }) {
  return (
    <div class="browse-menu__group">
      <span class="browse-menu__label">{label}</span>
      {items.map((item, index) => (
        <BrowseLink key={item.id} item={item} active={activeRoute === item.id} initial={mobile && label === "Discover" && index === 0} />
      ))}
    </div>
  );
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
}

function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )).filter((element) => !element.hasAttribute("hidden") && element.getAttribute("aria-hidden") !== "true");
}

export function AppShell({ activeRoute, children }: AppShellProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [browseSurface, setBrowseSurface] = useState<BrowseSurface>(null);
  const desktopBrowseRef = useRef<HTMLDivElement>(null);
  const desktopTriggerRef = useRef<HTMLButtonElement>(null);
  const desktopPanelRef = useRef<HTMLDivElement>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileDialogRef = useRef<HTMLDivElement>(null);
  const browseActive = browseNav.some((item) => item.id === activeRoute);

  const closeBrowse = (returnFocus = false) => {
    const surface = browseSurface;
    setBrowseSurface(null);
    if (!returnFocus) return;
    window.requestAnimationFrame(() => {
      if (surface === "desktop") desktopTriggerRef.current?.focus();
      if (surface === "mobile") mobileTriggerRef.current?.focus();
    });
  };

  const focusDesktopEdge = (edge: "first" | "last") => {
    window.requestAnimationFrame(() => {
      const links = desktopPanelRef.current?.querySelectorAll<HTMLAnchorElement>(".browse-link");
      if (!links?.length) return;
      (edge === "first" ? links[0] : links[links.length - 1])?.focus();
    });
  };

  const openDesktopBrowseFromKeyboard = (edge: "first" | "last") => {
    setBrowseSurface("desktop");
    focusDesktopEdge(edge);
  };

  useEffect(() => setBrowseSurface(null), [activeRoute]);

  useEffect(() => {
    if (browseSurface !== "desktop") return;
    const onPointerDown = (event: PointerEvent) => {
      if (desktopBrowseRef.current?.contains(event.target as Node)) return;
      setBrowseSurface(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [browseSurface]);

  useEffect(() => {
    if (browseSurface !== "mobile") return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => {
      mobileDialogRef.current?.querySelector<HTMLElement>("[data-mobile-nav-initial]")?.focus();
    });
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, [browseSurface]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && browseSurface) {
        event.preventDefault();
        closeBrowse(true);
        return;
      }
      if (isTypingTarget(event.target)) return;
      if (event.key === "/" || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k")) {
        event.preventDefault();
        setBrowseSurface(null);
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [browseSurface]);

  const onDesktopTriggerKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openDesktopBrowseFromKeyboard("first");
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openDesktopBrowseFromKeyboard("last");
    }
  };

  const onDesktopPanelKeyDown = (event: KeyboardEvent) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const panel = event.currentTarget as HTMLElement;
    const links = Array.from(panel.querySelectorAll<HTMLAnchorElement>(".browse-link"));
    if (!links.length) return;
    const currentIndex = links.indexOf(document.activeElement as HTMLAnchorElement);
    let nextIndex = currentIndex;
    if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = links.length - 1;
    else if (event.key === "ArrowDown") nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % links.length;
    else nextIndex = currentIndex < 0 ? links.length - 1 : (currentIndex - 1 + links.length) % links.length;
    event.preventDefault();
    links[nextIndex]?.focus();
  };

  const onMobileDialogKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Tab" || !mobileDialogRef.current) return;
    const focusable = focusableElements(mobileDialogRef.current);
    if (!focusable.length) return;
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const openSearch = () => {
    setBrowseSurface(null);
    setSearchOpen(true);
  };

  const skipToContent = (event: MouseEvent) => {
    event.preventDefault();
    const main = document.getElementById("main-content");
    main?.focus({ preventScroll: true });
    main?.scrollIntoView({ block: "start", behavior: "auto" });
  };

  return (
    <div class="site-shell">
      <a class="skip-link" href="#main-content" onClick={skipToContent}>Skip to content</a>

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
          <div class="browse-menu" ref={desktopBrowseRef}>
            <button
              ref={desktopTriggerRef}
              class={`browse-trigger${browseActive ? " is-active" : ""}`}
              type="button"
              aria-expanded={browseSurface === "desktop"}
              aria-controls="desktop-browse-menu"
              onClick={() => setBrowseSurface((surface) => surface === "desktop" ? null : "desktop")}
              onKeyDown={onDesktopTriggerKeyDown}
            >
              <Menu size={17} aria-hidden="true" />
              <span>Browse</span>
              <ChevronDown class="browse-trigger__chevron" size={14} aria-hidden="true" />
            </button>
            {browseSurface === "desktop" ? (
              <div
                ref={desktopPanelRef}
                id="desktop-browse-menu"
                class="browse-menu__panel"
                aria-label="Browse sections"
                onKeyDown={onDesktopPanelKeyDown}
              >
                <BrowseGroup label="Discover" items={discoverNav} activeRoute={activeRoute} />
                <BrowseGroup label="Reference" items={referenceNav} activeRoute={activeRoute} />
              </div>
            ) : null}
          </div>
        </nav>

        <div class="header-actions" aria-label="Utilities">
          <DataStatus />
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
            class={`icon-action utility-action lists-action${activeRoute === "saved" ? " is-active" : ""}`}
            href={hrefFor("/saved")}
            aria-label="My saved people and prayer list"
            aria-current={activeRoute === "saved" ? "page" : undefined}
          >
            <Bookmark size={18} aria-hidden="true" />
            <span class="utility-action__label">My lists</span>
          </a>
          <a
            class={`icon-action utility-action account-action${activeRoute === "account" ? " is-active" : ""}`}
            href={hrefFor("/account")}
            aria-label="Account and private sync"
            aria-current={activeRoute === "account" ? "page" : undefined}
          >
            <UserRound size={18} aria-hidden="true" />
            <span class="utility-action__label">Account</span>
          </a>
        </div>
      </header>

      <main id="main-content" class="main-content" tabIndex={-1}>{children}</main>

      <nav class="mobile-nav" aria-label="Primary navigation">
        {primaryNav.map((item) => <NavLink key={item.id} item={item} active={activeRoute === item.id} />)}
        <button
          ref={mobileTriggerRef}
          class={`nav-link mobile-browse-trigger${browseActive ? " is-active" : ""}`}
          type="button"
          aria-expanded={browseSurface === "mobile"}
          aria-controls="mobile-browse-menu"
          onClick={() => setBrowseSurface((surface) => surface === "mobile" ? null : "mobile")}
        >
          <Menu size={17} aria-hidden="true" />
          <span>More</span>
        </button>
      </nav>

      {browseSurface === "mobile" ? (
        <>
          <div class="mobile-nav-backdrop" aria-hidden="true" onClick={() => closeBrowse(false)} />
          <div
            ref={mobileDialogRef}
            id="mobile-browse-menu"
            class="mobile-browse-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-browse-heading"
            onKeyDown={onMobileDialogKeyDown}
          >
            <div class="mobile-browse-sheet__heading">
              <div><span class="eyebrow">Navigation</span><strong id="mobile-browse-heading">Browse more sections</strong></div>
              <button type="button" aria-label="Close navigation" onClick={() => closeBrowse(true)}><X size={18} aria-hidden="true" /></button>
            </div>
            <BrowseGroup label="Discover" items={discoverNav} activeRoute={activeRoute} mobile />
            <BrowseGroup label="Reference" items={referenceNav} activeRoute={activeRoute} mobile />
          </div>
        </>
      ) : null}

      {searchOpen ? <SearchDialog open onClose={() => setSearchOpen(false)} /> : null}
    </div>
  );
}
