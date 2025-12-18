import { Component, createMemo, JSX } from "solid-js";
import { Slider as KSlider } from "@kobalte/core/slider";
import { debounce } from "../methods/debounce";

interface Props {
  label?: JSX.Element;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange: (v: number) => void;
  saveFunc?: (v: number) => Promise<any>;
}

export const Slider: Component<Props> = (props) => {
  const debouncedSave = createMemo(() => (props.saveFunc ? debounce(props.saveFunc) : undefined));

  const handleChange = (val: number[]) => {
    const v = val[0];
    props.onValueChange(v);
    debouncedSave()?.(v);
  };

  return (
    <KSlider
      class="w-full"
      value={[props.value]}
      onChange={handleChange}
      minValue={props.min ?? 0}
      maxValue={props.max ?? 100}
      step={props.step ?? 1}
      getValueLabel={(params) => `${params.values[0]}%`}
    >
      <>{props.label && <KSlider.Label>{props.label}</KSlider.Label>}</>

      <div class="flex items-center mx-2 justify-between">
        <KSlider.Track class="h-2 w-[85%] rounded-4xl relative bg-dark-slate-gray-200">
          <KSlider.Fill />
          <KSlider.Thumb class="block bg-dark-slate-gray-600 w-4 h-4 top-[-4px] rounded-4xl">
            <KSlider.Input />
          </KSlider.Thumb>
        </KSlider.Track>
        <KSlider.ValueLabel class="ml-3" />
      </div>
    </KSlider>
  );
};

export default Slider;
