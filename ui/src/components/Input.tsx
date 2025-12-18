import { Component, createMemo, Show, splitProps, ValidComponent } from "solid-js";
import { TextField, type TextFieldInputProps, type TextFieldRootProps } from "@kobalte/core/text-field";
import type { PolymorphicProps } from "@kobalte/core";
import { tv } from "tailwind-variants";

import { debounce } from "../methods/debounce";

const inputRoot = tv({
  base: "flex gap-1",
  variants: {
    labelPosition: {
      inline: "flex-row items-center",
      above: "flex-col",
    },
  },
  defaultVariants: {
    labelPosition: "inline",
  },
});

const inputField = tv({
  base: "w-full rounded-sm outline-none",
  variants: {
    variant: {
      bordered: "border-2 border-ash-gray-400",
      none: "",
    },
    padding: {
      yes: "px-2 py-1",
      no: "",
    },
    background: {
      yes: "bg-charcoal-600",
      no: "",
    },
  },
  defaultVariants: {
    variant: "none",
    padding: "yes",
    background: "yes",
  },
});

type InputProps<T extends ValidComponent = "input"> = PolymorphicProps<T, TextFieldInputProps<T>>;

interface ExtraProps {
  label?: string;
  variant?: "bordered" | "none";
  labelPosition?: "inline" | "above";
  noPadding?: boolean;
  noBackground?: boolean;
  inputProps?: InputProps;
  saveFunc?: (v: string) => Promise<any>;
}

type InputRootProps<T extends ValidComponent = "div"> = ExtraProps &
  PolymorphicProps<T, TextFieldRootProps<T>>;

export const Input: Component<InputRootProps> = (props) => {
  const [local, others] = splitProps(props, [
    "label",
    "class",
    "variant",
    "noPadding",
    "noBackground",
    "inputProps",
    "labelPosition",
    "saveFunc",
    "onChange",
  ]);

  const debouncedSave = createMemo(() => (local.saveFunc ? debounce(local.saveFunc) : undefined));

  const handleChange = (v: string) => {
    local.onChange?.(v);
    debouncedSave()?.(v);
  };

  return (
    <TextField
      class={inputRoot({ labelPosition: local.labelPosition, class: local.class })}
      {...others}
      onChange={handleChange}
    >
      <Show when={local.label}>
        <TextField.Label>{local.label}</TextField.Label>
      </Show>
      <TextField.Input
        {...local.inputProps}
        class={inputField({
          variant: local.variant,
          padding: local.noPadding ? "no" : "yes",
          background: local.noBackground ? "no" : "yes",
          class: local.inputProps?.class,
        })}
      />
    </TextField>
  );
};

export default Input;
