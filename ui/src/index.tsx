import { lazy } from "solid-js";
import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";

import "./index.css";
import { ThemeProvider } from "./config/theme";

const Lobby = lazy(() => import("./routes/Lobby"));
const GameHome = lazy(() => import("./routes/GameHome"));
const JoinLobby = lazy(() => import("./routes/JoinLobby"));
const GameRoom = lazy(() => import("./routes/GameRoom"));
const NotFound = lazy(() => import("./routes/NotFound"));

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?"
  );
}

render(
  () => (
    <ThemeProvider>
      <Content />
    </ThemeProvider>
  ),
  root!
);

function Content() {
  return (
    <Router>
      <Route path="/" component={GameHome} />
      <Route path="/lobby/:code" component={Lobby} />
      <Route path="/join/:code" component={JoinLobby} />
      <Route path="/game/:code" component={GameRoom} />
      <Route path="/*paramName" component={NotFound} />
    </Router>
  );
}
