import { Component, createMemo, JSX, mergeProps, splitProps } from "solid-js";

import { debounce } from "../methods/debounce";

interface DateInputProps {
  label?: string;
  containerClass?: string;
  class?: string;
  inputProps?: JSX.InputHTMLAttributes<HTMLInputElement>;
}

export const DateInput: Component<DateInputProps> = (props) => {
  const [local, others] = splitProps(props, ["label", "class", "containerClass", "inputProps"]);

  const today = new Date().toLocaleDateString("en-CA");

  const inputMerged = createMemo(() =>
    mergeProps(
      {
        type: "date",
        max: today,
        class: `input rounded-sm px-2 py-1 bg-cambridge-blue-800/20 border-1 text-cambridge-blue-800 ${
          local.class ?? ""
        } ${local.inputProps?.class ?? ""}`,
      },
      local.inputProps
    )
  );

  return (
    <label class={`${props.containerClass ?? ""} flex flex-row space-y-1`} {...others}>
      {props.label && <span>{props.label}</span>}
      <input {...inputMerged()} value={inputMerged().value ?? ""} />
    </label>
  );
};

interface DataProps extends DateInputProps {
  saveFunc: (v: string) => Promise<any>;
  onChange: (v: string) => void;
}

export const DataDateInput: Component<DataProps> = (props) => {
  const [local, others] = splitProps(props, ["onChange", "saveFunc", "inputProps"]);
  const debouncedSave = createMemo(() => debounce(local.saveFunc));

  return (
    <DateInput
      inputProps={{
        ...local.inputProps,
        onInput: (e) => {
          props.onChange?.(e.currentTarget.value);
          debouncedSave()(e.currentTarget.value);
        },
      }}
      {...others}
    />
  );
};

export default DateInput;
