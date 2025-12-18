import { Component } from "solid-js";
import Loader from "lucide-solid/icons/loader";

const LoadFullScreen: Component = () => {
  return (
    <div class="fixed inset-0 z-100 flex items-center justify-center bg-gray-800/25">
      <Loader class="w-9 h-9 animate-spin text-gray-700" />
    </div>
  );
};

export default LoadFullScreen;
