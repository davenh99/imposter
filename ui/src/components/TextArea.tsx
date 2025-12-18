import { createEffect, on, Component, Show, splitProps, ValidComponent, createMemo } from "solid-js";
import { TextField, type TextFieldInputProps, type TextFieldRootProps } from "@kobalte/core/text-field";
import type { PolymorphicProps } from "@kobalte/core";

import { debounce } from "../methods/debounce";

type InputProps<T extends ValidComponent = "input"> = PolymorphicProps<T, TextFieldInputProps<T>>;

interface ExtraProps {
  label?: string;
  saveFunc?: (v: string) => Promise<any>;
  inputProps?: InputProps;
}

type InputRootProps<T extends ValidComponent = "div"> = ExtraProps &
  PolymorphicProps<T, TextFieldRootProps<T>>;

export const TextArea: Component<InputRootProps> = (props) => {
  const [local, others] = splitProps(props, ["label", "class", "inputProps"]);
  let textareaRef: HTMLTextAreaElement | undefined;
  const debouncedSave = createMemo(() => (props.saveFunc ? debounce(props.saveFunc) : undefined));

  const handleChange = (v: string) => {
    props.onChange?.(v);
    debouncedSave()?.(v);
  };

  const autoResize = () => {
    if (!textareaRef) return;
    textareaRef.style.height = "auto";
    textareaRef.style.height = `${textareaRef.scrollHeight}px`;
  };

  createEffect(
    on(
      () => others.value,
      () => autoResize()
    )
  );

  return (
    <TextField class={local.class ?? ""} {...others} onChange={handleChange}>
      <Show when={local.label}>
        <TextField.Label>{local.label}</TextField.Label>
      </Show>
      <TextField.TextArea
        ref={textareaRef}
        class={`w-full resize-none bg-charcoal-600 rounded-md overflow-hidden px-2 py-1`}
        {...local.inputProps}
      />
    </TextField>
  );
};
