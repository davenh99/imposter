import { Component } from "solid-js";
import { Select as KobalteSelect } from "@kobalte/core/select";
import Check from "lucide-solid/icons/check";
import UpDown from "lucide-solid/icons/chevrons-up-down";

interface Props {
  values: string[];
  value: string;
  onChange: (v: string | null) => void;
  placeholder?: string;
}

export const Select: Component<Props> = (props) => {
  return (
    <KobalteSelect
      multiple={false}
      value={props.value}
      onChange={props.onChange}
      options={props.values}
      placeholder={props.placeholder}
      itemComponent={(props) => (
        <KobalteSelect.Item item={props.item} class="flex flex-row space-x-1 px-1">
          <KobalteSelect.ItemLabel>{props.item.textValue}</KobalteSelect.ItemLabel>
          <KobalteSelect.ItemIndicator>
            <Check size={16} />
          </KobalteSelect.ItemIndicator>
        </KobalteSelect.Item>
      )}
    >
      <KobalteSelect.Trigger
        class={`rounded-sm border-1 bg-dark-slate-gray-900/20 flex flex-row px-3
                py-0.5 items-center justify-between w-full`}
      >
        <KobalteSelect.Value<string>>{(state) => state.selectedOption()}</KobalteSelect.Value>
        <KobalteSelect.Icon>
          <UpDown size={16} />
        </KobalteSelect.Icon>
      </KobalteSelect.Trigger>
      <KobalteSelect.Portal>
        <KobalteSelect.Content class="rounded-sm border-1 bg-charcoal-500 text-dark-slate-gray-900">
          <KobalteSelect.Listbox class="bg-dark-slate-gray-900/20 max-h-50 overflow-y-auto" />
        </KobalteSelect.Content>
      </KobalteSelect.Portal>
    </KobalteSelect>
  );
};

export default Select;
