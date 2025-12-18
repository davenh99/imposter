import { Component, Show } from "solid-js";

interface GameInputProps {
  value: string;
  onInput: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  maxlength?: number;
  type?: string;
  class?: string;
}

export const GameInput: Component<GameInputProps> = (props) => {
  return (
    <div class="w-full">
      <Show when={props.label}>
        <label class="block text-sm font-semibold text-gray-700 mb-2">{props.label}</label>
      </Show>
      <input
        type={props.type || "text"}
        value={props.value}
        onInput={(e) => props.onInput(e.currentTarget.value)}
        placeholder={props.placeholder}
        maxlength={props.maxlength}
        class={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
          props.error ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"
        } ${props.class || ""}`}
      />
      <Show when={props.error}>
        <p class="text-red-500 text-sm mt-1">{props.error}</p>
      </Show>
    </div>
  );
};
