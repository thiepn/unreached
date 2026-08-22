import type { ComponentChildren } from "preact";
import {
  Bookmark,
  Compass,
  Globe2,
  Info,
  Map,
  Search,
  UsersRound
} from "lucide-preact";

import { hrefFor, type RouteId } from "../app/router";

interface AppShellProps {
  activeRoute: RouteId;
  children: ComponentChildren;
}

interface NavItem {
  id: RouteId;
  label: string;
  path: string;
  icon: typeof Map;
}

const primaryNav: NavItem[] = [
  { id: "explore", label: "Explore", path: "/", icon: Map },
  { id: "peoples", label: "Peoples", path: "/peoples", icon: UsersRound },
  { id: "countries", label: "Countries", path: "/countries", icon: Globe2 },
  { id: "pray", label: "Pray", path: "/pray", icon: Compass },
  { id: "about", label: "About", path: "/about", icon: Info }
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

export function AppShell({ activeRoute, children }: AppShellProps) {
  return (
    <div class="site-shell">
      <a class="skip-link" href="#main-content">
        Skip to content
      </a>

      <header class="site-header">
        <a class="brand" href={hrefFor("/")} aria-label="Unreached home">
          <span class="brand-mark" aria-hidden="true">
            <span class="brand-mark__meridian" />
            <span class="brand-mark__parallel" />
          </span>
          <span class="brand-word">Unreached</span>
        </a>

        <nav class="desktop-nav" aria-label="Primary navigation">
          {primaryNav.map((item) => (
            <NavLink key={item.id} item={item} active={activeRoute === item.id} />
          ))}
        </nav>

        <div class="header-actions">
          <button
            class="icon-action"
            type="button"
            aria-label="Search"
            title="Search foundation — data-backed search arrives in U10"
            disabled
          >
            <Search size={18} aria-hidden="true" />
          </button>
          <a
            class={`icon-action${activeRoute === "saved" ? " is-active" : ""}`}
            href={hrefFor("/saved")}
            aria-label="Saved peoples"
            aria-current={activeRoute === "saved" ? "page" : undefined}
          >
            <Bookmark size={18} aria-hidden="true" />
          </a>
        </div>
      </header>

      <main id="main-content" class="main-content" tabIndex={-1}>
        {children}
      </main>

      <nav class="mobile-nav" aria-label="Primary navigation">
        {primaryNav.slice(0, 4).map((item) => (
          <NavLink key={item.id} item={item} active={activeRoute === item.id} />
        ))}
      </nav>
    </div>
  );
}
