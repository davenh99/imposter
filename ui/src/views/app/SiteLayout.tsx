import { ParentComponent } from "solid-js";
import { A } from "@solidjs/router";
import User from "lucide-solid/icons/user";

import Container from "./Container";
import Header from "./Header";
import Footer from "./Footer";
import pkg from "../../../package.json";
import { usePB } from "../../config/pocketbase";

export const SiteLayout: ParentComponent = (props) => {
  const { store } = usePB();

  return (
    <div class="flex flex-col h-screen bg-charcoal-500 text-dark-slate-gray-900">
      <Header>
        <nav class="flex justify-between items-center">
          <A href="/">
            <p style={{ "font-family": "Audiowide" }} class="text-dark-slate-gray-800 text-xl">
              Progressa
            </p>
          </A>

          <A href={!store.user ? "/auth" : "/profile"} class="flex flex-col items-center">
            <User size={28} />
          </A>
        </nav>
      </Header>

      <main class="flex-1 flex flex-col overflow-y-auto">
        <Container class="flex flex-col items-center">{props.children}</Container>
      </main>

      <Footer class="text-xs">
        <p>version {pkg.version}</p>
        <A class="underline" href="/privacy">
          Privacy Policy
        </A>
        <A class="underline" href="https://github.com/davenh99/progressa">
          <i class="fa-brands fa-github"></i> Source Code
        </A>
        <p>© 2025 David Ham</p>
      </Footer>
    </div>
  );
};

export default SiteLayout;
