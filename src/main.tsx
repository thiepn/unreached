import { render } from "preact";

import { App } from "./app/App";
import { initializeOfflineRuntime } from "./offline/runtime";
import { installPeopleGroupsReconnectRefresh, warmPeopleGroupsRuntime } from "./providers/peoplegroups";
import { initializePrivateSyncRuntime } from "./sync/runtime";
import "@fontsource-variable/newsreader";
import "@fontsource-variable/source-sans-3";
import "maplibre-gl/dist/maplibre-gl.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/app.css";
import "./styles/map.css";
import "./styles/mission-map.css";
import "./styles/map-layout.css";
import "./styles/countries.css";
import "./styles/peoples.css";
import "./styles/context.css";
import "./styles/prayer.css";
import "./styles/languages.css";
import "./styles/u12e-languages.css";
import "./styles/discovery.css";
import "./styles/about.css";
import "./styles/v101-hotfix.css";
import "./styles/v11.css";
import "./styles/v12.css";
import "./styles/editorial/coverage.css";
import "./styles/editorial/coverage-expansion.css";
import "./styles/prayer/practice.css";
import "./styles/prayer/rotation.css";
import "./styles/prayer/session.css";
import "./styles/shell/data-state.css";
import "./styles/account/base.css";
import "./styles/shell/navigation.css";
import "./styles/people/explorer.css";
import "./styles/people/profile.css";
import "./styles/explore/map-workspace.css";
import "./styles/foundation/detail-records.css";
import "./styles/prayer/guides-and-lists.css";
import "./styles/account/ux.css";
import "./styles/foundation/accessibility.css";

initializeOfflineRuntime();
initializePrivateSyncRuntime();
render(<App />, document.getElementById("app")!);

installPeopleGroupsReconnectRefresh();
const idleWindow = window as Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
};
if (typeof idleWindow.requestIdleCallback === "function") {
  idleWindow.requestIdleCallback(warmPeopleGroupsRuntime, { timeout: 1_200 });
} else {
  window.setTimeout(warmPeopleGroupsRuntime, 300);
}
