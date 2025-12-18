/* @refresh reload */
import { lazy, Show } from "solid-js";
import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";
import { toaster } from "@kobalte/core/toast";

import "./index.css";
import { PBProvider, usePB } from "./config/pocketbase";
import { ThemeProvider } from "./config/theme";
import AppLayout from "./views/app/AppLayout";
import LoadFullScreen from "./views/app/LoadFullScreen";
import SiteLayout from "./views/app/SiteLayout";
import { Toaster } from "./config/toaster";
import { Toast } from "./config/toaster";
import { Store } from "./config/store/Store";
import { IGNORE_ERRORS } from "../constants";

const Landing = lazy(() => import("./routes/Landing"));
const Privacy = lazy(() => import("./routes/Privacy"));
const NotFound = lazy(() => import("./routes/NotFound"));
const Auth = lazy(() => import("./routes/Auth"));
const LogSession = lazy(() => import("./routes/LogSession"));
const Exercises = lazy(() => import("./routes/Exercises"));
const Routines = lazy(() => import("./routes/Routines"));
const Profile = lazy(() => import("./routes/Profile"));

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?"
  );
}

window.onerror = (msg) => {
  if (!IGNORE_ERRORS.includes(String(msg))) {
    toaster.show((props) => <Toast {...props} variant="error" title="JS Error" msg={String(msg)} />);
  }
};

window.onunhandledrejection = (event) => {
  toaster.show((props) => (
    <Toast {...props} variant="error" title="Unhandled Promise" msg={String(event.reason)} />
  ));
};

const originalConsoleError = console.error;
console.error = (...args) => {
  originalConsoleError(...args);
  toaster.show((props) => (
    <Toast {...props} variant="error" title="Error" msg={args.map(String).join(" ")} />
  ));
};

render(
  () => (
    <PBProvider>
      <ThemeProvider>
        <Store>
          <Content />
          <Toaster />
        </Store>
      </ThemeProvider>
    </PBProvider>
  ),
  root!
);

function Content() {
  const { store } = usePB();

  // TODO subscribe: window.addeventlistener('online' & 'offline')
  // and run checkAuth() if offline periodically?

  return (
    <Show when={!store.loading} fallback={<LoadFullScreen />}>
      <Show when={!store.networkError} fallback={<p>Network Error, could not connect to server.</p>}>
        <Router>
          <Show when={!!store.user} fallback={<Site />}>
            <App />
          </Show>
          <Route path="/*paramName" component={NotFound} />
        </Router>
      </Show>
    </Show>
  );
}

function App() {
  return (
    <Route path="/" component={AppLayout}>
      <Route path="/" component={LogSession} />
      <Route path="/log" component={LogSession} />
      <Route path="/exercises" component={Exercises} />
      <Route path="/routines" component={Routines} />
      <Route path="/profile" component={Profile} />
    </Route>
  );
}

function Site() {
  return (
    <Route path="/" component={SiteLayout}>
      <Route path="/" component={Landing} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/auth" component={Auth} />
    </Route>
  );
}
