import { Component, Show } from "solid-js";
import { Select as KobalteSelect } from "@kobalte/core/select";
import Check from "lucide-solid/icons/check";
import UpDown from "lucide-solid/icons/chevrons-up-down";

import NumberInput from "./NumberInput";
import DataTime from "./Time";

interface Props {
  values: MeasurementValuesRecord[];
  value: MeasurementValuesRecord | null;
  onChange: (v: MeasurementValuesRecord | null) => void;
  placeholder?: string;
}

export const MeasurementValueSelect: Component<Props> = (props) => {
  return (
    <KobalteSelect
      multiple={false}
      value={props.value}
      optionValue="id"
      optionTextValue="value"
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
      <KobalteSelect.Trigger class="rounded-sm border-1 bg-dark-slate-gray-900/20 flex flex-row px-1 items-center space-x-1">
        <KobalteSelect.Value<MeasurementValuesRecord>>
          {(state) => state.selectedOption().value}
        </KobalteSelect.Value>
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

interface DataProps {
  values: MeasurementValuesRecord[];
  value: MeasurementValuesRecord | null;
  onValueChange: (v: MeasurementValuesRecord | null) => void;
  saveFunc: (id: string) => Promise<void>;
}

export const DataMeasurementValueSelect: Component<DataProps> = (props) => {
  return (
    <MeasurementValueSelect
      value={props.value}
      values={props.values}
      onChange={(v) => props.saveFunc(v?.id || "").then(() => props.onValueChange(v))}
    />
  );
};

export default MeasurementValueSelect;

interface MeasurementValueSelectProps {
  numeric: boolean;
  key:
    | "measurementNumeric"
    | "measurement2Numeric"
    | "measurement3Numeric"
    | "measurementValue"
    | "measurement2Value"
    | "measurement3Value";
  measurementType?: string;
  values?: MeasurementValuesRecord[];
  value?: MeasurementValuesRecord | null;
  valueNumeric?: number;
  onValueChange: (v: any) => void;
  saveFunc: (v: any) => Promise<void>;
}

export const MultiMeasurementValueSelect: Component<MeasurementValueSelectProps> = (props) => {
  return (
    <Show
      when={props.numeric}
      fallback={
        <DataMeasurementValueSelect
          values={props.values ?? []}
          value={props.value ?? null}
          onValueChange={(v) => props.onValueChange(v)}
          saveFunc={(v) => props.saveFunc(v)}
        />
      }
    >
      <Show
        when={props.measurementType === "8ldlgtjjvy3ircl"}
        fallback={
          <div class="flex flex-row space-x-1">
            <NumberInput
              rawValue={props.valueNumeric ?? 0}
              onRawValueChange={(v: any) => props.onValueChange(v)}
              saveFunc={(v) => props.saveFunc(v)}
            />
          </div>
        }
      >
        <DataTime
          value={props.valueNumeric ?? 0}
          onValueChange={(v: any) => props.onValueChange(v)}
          saveFunc={(v) => props.saveFunc(v)}
        />
      </Show>
    </Show>
  );
};
