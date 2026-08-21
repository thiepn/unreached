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
import "./styles/countries.css";

render(<App />, document.getElementById("app")!);
