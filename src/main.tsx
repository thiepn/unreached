import { render } from "preact";
import { setWorkerUrl } from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-csp-worker.js?url";

import { App } from "./app/App";
import "@fontsource-variable/newsreader";
import "@fontsource-variable/source-sans-3";
import "maplibre-gl/dist/maplibre-gl.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/app.css";
import "./styles/map.css";
import "./styles/mission-map.css";
import "./styles/countries.css";
import "./styles/peoples.css";
import "./styles/context.css";
import "./styles/prayer.css";
import "./styles/languages.css";
import "./styles/discovery.css";
import "./styles/about.css";

// MapLibre 5 ships a dedicated worker bundle for environments where an
// inlined Blob worker is undesirable. Using that worker explicitly also keeps
// Vite/Rolldown from rebundling the worker into the application scope.
setWorkerUrl(maplibreWorkerUrl);

render(<App />, document.getElementById("app")!);
