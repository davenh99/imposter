import { Component } from "solid-js";
import { Select } from "@kobalte/core/select";

const RPE_SELECTIONS = [
  { val: 0, color: "bg-gray-500" },
  { val: 1, color: "bg-blue-400" },
  { val: 2, color: "bg-green-400" },
  { val: 3, color: "bg-green-300" },
  { val: 4, color: "bg-green-200" },
  { val: 5, color: "bg-yellow-100" },
  { val: 6, color: "bg-orange-200" },
  { val: 7, color: "bg-orange-300" },
  { val: 8, color: "bg-red-400" },
  { val: 8.5, color: "bg-red-500" },
  { val: 9, color: "bg-red-600" },
  { val: 9.5, color: "bg-red-700" },
  { val: 10, color: "bg-red-800" },
  { val: 11, color: "bg-red-900" },
];

const RPE_VALUE_COLOR_MAP = Object.fromEntries(RPE_SELECTIONS.map((sel) => [sel.val, sel.color]));

const getColorByValue = (val: number) => RPE_VALUE_COLOR_MAP[val] ?? "bg-orange-200";

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export const RPESelect: Component<Props> = (props) => {
  return (
    <Select
      multiple={false}
      value={{ val: props.value / 10, color: getColorByValue(props.value / 10) }}
      onChange={(v) => props.onChange(v ? v.val * 10 : 0)}
      options={RPE_SELECTIONS}
      optionValue="color"
      optionTextValue="val"
      itemComponent={(props) => (
        <Select.Item
          class={`${props.item.rawValue.color} px-1 m-1 w-10 text-center text-black rounded-sm`}
          item={props.item}
        >
          <Select.ItemLabel>{props.item.textValue}</Select.ItemLabel>
        </Select.Item>
      )}
    >
      <Select.Trigger>
        <Select.Value<{ val: number; color: string }>>
          {(state) => {
            return (
              <div class={`rounded-sm w-10 text-black ${state.selectedOption().color}`}>
                <p>{state.selectedOption().val}</p>
              </div>
            );
          }}
        </Select.Value>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content>
          <Select.Listbox class="bg-charcoal-600 p-1 rounded-xl flex flex-row flex-wrap w-86" />
        </Select.Content>
      </Select.Portal>
    </Select>
  );
};

export default RPESelect;
