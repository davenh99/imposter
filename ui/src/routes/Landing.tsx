import { Component } from "solid-js";
import { Button } from "../components";
import Card from "../views/app/Card";
import { A } from "@solidjs/router";

const Landing: Component = () => {
  return (
    <div class="flex-1 overflow-y-auto text-dark-slate-gray-900 space-y-3 max-w-150">
      <div class="flex flex-col items-center text-center">
        <h1 style={{ "font-family": "Audiowide" }} class="text-dark-slate-gray-800 mb-2 text-5xl">
          Progressa
        </h1>
        <h2 class="mb-2">Advanced workout tracking for in-depth analysis</h2>
        <p>
          Progressa is an app for tracking any type of workout or exercise, allowing analysis of workout
          history and determining how to maximise performance.
        </p>
        <div class="w-full flex justify-center space-x-5 mt-5 mb-2">
          <Button href="/auth" variantColor="good">
            Sign in
          </Button>
        </div>
      </div>
      <Card>
        <h2 class="mb-2 text-center">Progressa for mobile</h2>
        <p>
          Progressa is available for any device with a web browser. For convenience, it can be downloaded as
          an app on any device.{" "}
          <A
            class="underline"
            href="https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing"
          >
            Read here
          </A>{" "}
          about how to install the app (it's not too hard 😊).
        </p>
      </Card>
    </div>
  );
};

export default Landing;
