import "@fontsource-variable/newsreader/wght.css";
import "@fontsource-variable/source-sans-3/wght.css";

import { render } from "preact";

import { App } from "./app/App";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/app.css";

const root = document.getElementById("app");

if (!root) {
  throw new Error("Unreached could not find the application root.");
}

render(<App />, root);
