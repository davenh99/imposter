import { Component, createMemo, Show, splitProps, ValidComponent } from "solid-js";
import {
  NumberField,
  type NumberFieldInputProps,
  type NumberFieldRootProps,
} from "@kobalte/core/number-field";
import type { PolymorphicProps } from "@kobalte/core";
import { debounce } from "../methods/debounce";

type InputProps<T extends ValidComponent = "input"> = PolymorphicProps<T, NumberFieldInputProps<T>>;

interface ExtraProps {
  label?: string;
  width?: string;
  inputProps?: InputProps;
  saveFunc?: (v: number) => Promise<any>;
}

type InputRootProps<T extends ValidComponent = "div"> = ExtraProps &
  PolymorphicProps<T, NumberFieldRootProps<T>>;

export const NumberInput: Component<InputRootProps> = (props) => {
  const [local, others] = splitProps(props, ["label", "class", "width", "inputProps", "saveFunc"]);

  const debouncedSave = createMemo(() => (local.saveFunc ? debounce(local.saveFunc) : undefined));

  const handleChange = (v: string) => {
    debouncedSave()?.(Number(v.replace(/,/g, "")));
  };

  const inputClasses = `input outline-none text-right my-0 ${local.inputProps?.class ?? ""}`;

  return (
    <NumberField onChange={handleChange} class={`flex flex-row space-x-1 ${local.class ?? ""}`} {...others}>
      <Show when={local.label}>
        <NumberField.Label>{local.label}</NumberField.Label>
      </Show>
      <NumberField.Input
        class={inputClasses}
        style={{ width: local.width ?? "2.5rem" }}
        {...local.inputProps}
        onFocus={(e: FocusEvent & { currentTarget: HTMLInputElement }) => e.currentTarget.select()}
      />
    </NumberField>
  );
};

export default NumberInput;
