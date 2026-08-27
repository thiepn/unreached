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
import "./styles/v14.css";
import "./styles/v15.css";
import "./styles/v16.css";
import "./styles/v17.css";
import "./styles/v18.css";
import "./styles/v19.css";
import "./styles/v20.css";
import "./styles/v21-navigation.css";
import "./styles/v22-peoples-explorer.css";
import "./styles/v23-people-profile.css";
import "./styles/v24-explore-map.css";
import "./styles/v25-countries-languages.css";

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
