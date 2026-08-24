import { render } from "preact";

import { App } from "./app/App";
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

render(<App />, document.getElementById("app")!);