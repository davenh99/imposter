import { Component, For } from "solid-js";
import { debounce } from "../methods/debounce";

export interface RatingOption<T extends string | number> {
  emoji: string;
  label: string;
  value: T;
}

interface RatingSelectorProps<T extends string | number> {
  label?: string;
  value?: T;
  options: RatingOption<T>[];
  onValueChange: (v: T) => void;
  saveFunc: (v: T) => Promise<any>;
}

export const RatingSelector = <T extends string | number>(props: RatingSelectorProps<T>) => {
  const debouncedSave = debounce(props.saveFunc, 400);

  const handleClick = (v: T) => {
    props.onValueChange(v);
    debouncedSave(v);
  };

  const currentLabel = () => props.options.find((o) => o.value === props.value)?.label || "";

  return (
    <div class="flex flex-col gap-2">
      {props.label && <label class="text-sm">{props.label}</label>}

      <div class="flex gap-3 flex-row items-center">
        <For each={props.options}>
          {(opt) => (
            <button
              type="button"
              onClick={() => handleClick(opt.value)}
              class={`text-2xl transition-transform ${
                props.value === opt.value ? "scale-125" : "opacity-50 hover:opacity-100"
              }`}
              title={opt.label}
            >
              {opt.emoji}
            </button>
          )}
        </For>

        <p class="ml-2 font-bold">{currentLabel()}</p>
      </div>
    </div>
  );
};
