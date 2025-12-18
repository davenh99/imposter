import { Component, Show } from "solid-js";
import { Checkbox as KobalteCheckbox } from "@kobalte/core/checkbox";
import Check from "lucide-solid/icons/check";

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}

export const Checkbox: Component<Props> = (props) => {
  return (
    <KobalteCheckbox
      checked={props.checked}
      onChange={props.onChange}
      class="flex flex-row space-x-2 items-center"
    >
      <KobalteCheckbox.Input />
      <KobalteCheckbox.Control class="h-5 w-5 bg-charcoal-600 rounded-sm">
        <KobalteCheckbox.Indicator class="text-green-400">
          <Check />
        </KobalteCheckbox.Indicator>
      </KobalteCheckbox.Control>
      <Show when={props.label}>
        <KobalteCheckbox.Label>{props.label}</KobalteCheckbox.Label>
      </Show>
    </KobalteCheckbox>
  );
};

interface DataProps {
  value: boolean;
  onValueChange?: (v: boolean) => void;
  saveFunc: (v: boolean) => Promise<void>;
  label?: string;
}

export const DataCheckbox: Component<DataProps> = (props) => {
  return (
    <Checkbox
      checked={props.value}
      label={props.label}
      onChange={(v: boolean) => props.saveFunc(v).then(() => props.onValueChange?.(v))}
    />
  );
};

export default Checkbox;
