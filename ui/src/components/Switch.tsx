import { Switch as KSwitch } from "@kobalte/core/switch";
import { Component, Show } from "solid-js";

import { debounce } from "../methods/debounce";

interface Props {
  class?: string;
  label?: string;
  checked?: boolean;
  onValueChange?: (v: boolean) => void;
  saveFunc?: (v: boolean) => Promise<any>;
}

export const Switch: Component<Props> = (props) => {
  return (
    <KSwitch
      class={`flex flex-row justify-between items-center ${props.class ?? ""}`}
      checked={props.checked}
      onChange={(v) => {
        props.onValueChange && props.onValueChange(v);
        props.saveFunc && debounce(props.saveFunc)(v);
      }}
    >
      <Show when={props.label}>
        <KSwitch.Label>{props.label}</KSwitch.Label>
      </Show>
      <KSwitch.Input class="" />
      <KSwitch.Control
        class={`flex items-center w-10 h-6 bg-charcoal-500 rounded-full border-1 border-charcoal-200
        data-[checked]:bg-forest-green-700 data-[checked]:border-forest-green-700 transition-all`}
      >
        <KSwitch.Thumb
          class={`h-5 w-5 rounded-full bg-dark-slate-gray-500 transition-transform 
            data-[checked]:[transform:translateX(calc(100%-2px))]`}
        />
      </KSwitch.Control>
    </KSwitch>
  );
};

export default Switch;
