import type { ComponentChildren } from "preact";
import { Bookmark, Compass, Search } from "lucide-preact";

function DemoSection({
  id,
  label,
  title,
  description,
  children,
}: {
  id: string;
  label: string;
  title: string;
  description: string;
  children: ComponentChildren;
}) {
  return (
    <section id={id} class="v3-design-system__section">
      <div class="v3-design-system__section-head">
        <span class="v3-type-label">{label}</span>
        <h2 class="v3-type-heading-xl">{title}</h2>
        <p class="v3-type-body-lg">{description}</p>
      </div>
      {children}
    </section>
  );
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function DesignSystemPage() {
  return (
    <div class="v3-page v3-design-system" data-v3-design-system="true">
      <div class="v3-page__frame">
        <header class="v3-design-system__hero">
          <span class="v3-type-label">Unreached 3.0 · Phase 4</span>
          <h1 class="v3-type-display-xl">Visual Foundation</h1>
          <p class="v3-type-body-lg v3-reading">
            A cartographic and editorial system for a serious mission atlas: restrained surfaces,
            strong typography, geographic structure, explicit data semantics, and controls that stay
            useful on small screens.
          </p>
          <div class="v3-cluster">
            <span class="v3-status v3-status--unreached">Unreached</span>
            <span class="v3-status v3-status--progress">Limited progress</span>
            <span class="v3-status v3-status--established">Established</span>
            <span class="v3-status v3-status--unknown">Unknown</span>
          </div>
        </header>

        <nav class="v3-design-system__nav" aria-label="Visual foundation sections">
          <button class="v3-button v3-button--quiet" type="button" onClick={() => scrollTo("v3-type")}>Typography</button>
          <button class="v3-button v3-button--quiet" type="button" onClick={() => scrollTo("v3-color")}>Color</button>
          <button class="v3-button v3-button--quiet" type="button" onClick={() => scrollTo("v3-surfaces")}>Surfaces</button>
          <button class="v3-button v3-button--quiet" type="button" onClick={() => scrollTo("v3-controls")}>Controls</button>
          <button class="v3-button v3-button--quiet" type="button" onClick={() => scrollTo("v3-editorial")}>Editorial</button>
          <button class="v3-button v3-button--quiet" type="button" onClick={() => scrollTo("v3-map")}>Map</button>
        </nav>

        <DemoSection
          id="v3-type"
          label="Typography"
          title="Editorial voice, interface discipline"
          description="Newsreader carries identity and long-form hierarchy. Source Sans 3 carries navigation, data, controls, and supporting prose."
        >
          <div class="v3-type-sample" data-v3-typography-sample="true">
            <p class="v3-type-display-lg">The Hui of China</p>
            <p class="v3-type-heading-lg">People, place, language, faith, and gospel access</p>
            <p class="v3-type-body-lg">
              Large editorial type should feel like an atlas or geographic publication, not a dashboard card title.
            </p>
            <p class="v3-type-body">
              Interface and article body copy remain quiet, readable, and information-dense enough for sustained research.
            </p>
            <p class="v3-type-meta">Source context · reviewed profile · updated September 2026</p>
          </div>
        </DemoSection>

        <DemoSection
          id="v3-color"
          label="Color"
          title="Geography first; mission color stays semantic"
          description="Product accents support orientation. Mission-status colors are reserved for mission meaning rather than decorative branding."
        >
          <div class="v3-grid-4">
            <div class="v3-color-swatch v3-color-swatch--forest"><span>Forest</span><small>Navigation / product action</small></div>
            <div class="v3-color-swatch v3-color-swatch--ocean"><span>Ocean</span><small>Geography / information</small></div>
            <div class="v3-color-swatch v3-color-swatch--terrain"><span>Terrain</span><small>Place / editorial accent</small></div>
            <div class="v3-color-swatch v3-color-swatch--mission"><span>Mission status</span><small>Semantic only</small></div>
          </div>
        </DemoSection>

        <DemoSection
          id="v3-surfaces"
          label="Surfaces"
          title="Structure without a sea of floating cards"
          description="The system has four surface roles. Most reading content stays unboxed; borders and spacing establish hierarchy before shadows or rounded containers."
        >
          <div class="v3-surface-demo">
            <article class="v3-surface v3-surface--page v3-surface-pad-sm v3-stack-3">
              <span class="v3-type-label">Page</span>
              <strong class="v3-type-heading-md">Default canvas</strong>
              <p class="v3-type-body-sm">Unboxed content with hierarchy from type and spacing.</p>
            </article>
            <article class="v3-surface v3-surface--editorial v3-surface-pad v3-stack-3">
              <span class="v3-type-label">Editorial</span>
              <strong class="v3-type-heading-md">Contained reading object</strong>
              <p class="v3-type-body-sm">Used when content genuinely benefits from a bounded publication surface.</p>
            </article>
            <article class="v3-surface v3-surface--utility v3-surface-pad v3-stack-3">
              <span class="v3-type-label">Utility</span>
              <strong class="v3-type-heading-md">Controls and support</strong>
              <p class="v3-type-body-sm">Quiet structural fill for filters, metadata, and research controls.</p>
            </article>
            <article class="v3-surface v3-surface--overlay v3-surface-pad v3-stack-3">
              <span class="v3-type-label">Overlay</span>
              <strong class="v3-type-heading-md">Temporary layer</strong>
              <p class="v3-type-body-sm">Reserved for dialogs, sheets, menus, and transient map context.</p>
            </article>
          </div>
        </DemoSection>

        <DemoSection
          id="v3-controls"
          label="Controls"
          title="Compact, tactile, and accessible"
          description="Controls keep a 44px minimum target, visible focus states, restrained radii, and a clear primary/secondary hierarchy."
        >
          <div class="v3-control-demo">
            <div class="v3-control-demo__group">
              <div class="v3-cluster">
                <button class="v3-button v3-button--primary" data-v3-control="true" type="button"><Compass size={17} aria-hidden="true" />Explore</button>
                <button class="v3-button v3-button--secondary" data-v3-control="true" type="button"><Bookmark size={17} aria-hidden="true" />Save</button>
                <button class="v3-icon-button" data-v3-control="true" type="button" aria-label="Search"><Search size={18} aria-hidden="true" /></button>
              </div>
              <div class="v3-segmented" aria-label="Example view selector">
                <button type="button" aria-pressed="true">Atlas</button>
                <button type="button" aria-pressed="false">List</button>
                <button type="button" aria-pressed="false">Research</button>
              </div>
            </div>
            <div class="v3-control-demo__group">
              <div class="v3-field">
                <label for="v3-demo-search">Search people</label>
                <input id="v3-demo-search" class="v3-input" data-v3-control="true" value="Central Asia" readOnly />
              </div>
              <div class="v3-field">
                <label for="v3-demo-filter">Map view</label>
                <select id="v3-demo-filter" class="v3-select" data-v3-control="true" value="mission" onChange={() => undefined}>
                  <option value="mission">Mission context</option>
                  <option value="people">People contexts</option>
                </select>
              </div>
            </div>
          </div>
        </DemoSection>

        <DemoSection
          id="v3-editorial"
          label="Editorial"
          title="A people profile should read like an atlas article"
          description="The visual language supports a human narrative first, followed by evidence, mission context, prayer, and research detail."
        >
          <article class="v3-surface v3-surface--editorial v3-surface-pad-lg">
            <div class="v3-masthead">
              <div class="v3-masthead__meta">
                <span class="v3-type-label">Reviewed profile</span>
                <span class="v3-type-meta">China · East Asia</span>
              </div>
              <h3 class="v3-type-display-lg">Hui</h3>
              <p class="v3-type-body-lg v3-reading">
                A widely distributed Muslim ethnocultural population in China, represented here through a specific source context and reviewed editorial evidence.
              </p>
              <div class="v3-cluster">
                <span class="v3-status v3-status--unreached">Unreached</span>
                <button class="v3-button v3-button--primary" data-v3-control="true" type="button">Pray</button>
                <button class="v3-button v3-button--secondary" data-v3-control="true" type="button">Save</button>
              </div>
            </div>

            <div class="v3-fact-strip" aria-label="Example essential facts">
              <div class="v3-stat"><strong>15M</strong><span>represented population</span></div>
              <div class="v3-stat"><strong>Mandarin</strong><span>primary language</span></div>
              <div class="v3-stat"><strong>Sunni Islam</strong><span>source religion context</span></div>
              <div class="v3-stat"><strong>GSEC 1</strong><span>source classification</span></div>
            </div>

            <div class="v3-split" style={{ marginTop: "var(--v3-space-8)" }}>
              <div class="v3-editorial-body">
                <section class="v3-editorial-section">
                  <span class="v3-type-label">Who they are</span>
                  <h4 class="v3-type-heading-lg">Identity before statistics</h4>
                  <div class="v3-type-prose">
                    <p>Long-form contextual writing gets a calm reading width and a strong typographic hierarchy. Mission metrics support understanding rather than replacing it.</p>
                    <p>Sections remain mostly unboxed so the page feels like a publication instead of a collection of dashboard cards.</p>
                  </div>
                </section>
                <section class="v3-editorial-section">
                  <span class="v3-type-label">Gospel context</span>
                  <h4 class="v3-type-heading-lg">Explain the source-defined status</h4>
                  <div class="v3-type-prose"><p>Classification, church presence, resources, and uncertainty remain separate concepts. Research detail can be disclosed without dominating the first reading path.</p></div>
                </section>
              </div>
              <aside class="v3-rail">
                <div class="v3-surface v3-surface--utility v3-surface-pad v3-stack-3">
                  <span class="v3-type-label">Research note</span>
                  <strong>Source-scoped, not universal</strong>
                  <p class="v3-type-body-sm">The interface can explain methodology without making provider vocabulary the page's primary language.</p>
                </div>
                <div class="v3-source-note">
                  <strong>Source transparency</strong>
                  <p>PeopleGroups.org / IMB · source record and review details remain recoverable.</p>
                </div>
              </aside>
            </div>
          </article>
        </DemoSection>

        <DemoSection
          id="v3-map"
          label="Cartography"
          title="The map is a workspace, not a background illustration"
          description="Map chrome stays compact. Geography occupies the majority of the surface and semantic mission color is explained by a text legend."
        >
          <div class="v3-map-shell" data-v3-map-shell="true">
            <aside class="v3-map-rail">
              <div class="v3-stack-2">
                <span class="v3-type-label">World atlas</span>
                <strong class="v3-type-heading-md">Mission context</strong>
                <p class="v3-type-body-sm">Example composition only; Phase 6 will own production Explore behavior.</p>
              </div>
              <div class="v3-map-legend" aria-label="Example mission legend">
                <div class="v3-map-legend__row"><span class="v3-map-legend__swatch v3-map-legend__swatch--unreached" /><span>Unreached range</span><span>&lt;2%</span></div>
                <div class="v3-map-legend__row"><span class="v3-map-legend__swatch v3-map-legend__swatch--progress" /><span>Limited progress</span><span>context</span></div>
                <div class="v3-map-legend__row"><span class="v3-map-legend__swatch v3-map-legend__swatch--established" /><span>Established</span><span>context</span></div>
              </div>
              <button class="v3-button v3-button--secondary" data-v3-control="true" type="button">About this map</button>
            </aside>
            <div class="v3-map-stage" aria-label="Abstract map composition preview">
              <span class="v3-map-label v3-map-label--one">Central Asia</span>
              <span class="v3-map-label v3-map-label--two">South Asia</span>
              <span class="v3-map-label v3-map-label--three">East Asia</span>
            </div>
          </div>
        </DemoSection>
      </div>
    </div>
  );
}
