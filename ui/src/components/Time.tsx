import { Component, createEffect, createSignal, untrack } from "solid-js";
import NumberInput from "./NumberInput";

interface Props {
  value: number;
  onValueChange: (v: number) => void;
  saveFunc: (v: number) => Promise<any>;
  maxMinutes?: number;
}

export const DataTime: Component<Props> = (props) => {
  const [minutes, setMinutes] = createSignal(Math.floor(props.value / 60));
  const [seconds, setSeconds] = createSignal(Math.round(props.value % 60));
  const [timesEnteredMinutes, setTimesEnteredMinutes] = createSignal(0);
  const [timesEnteredSeconds, setTimesEnteredSeconds] = createSignal(0);
  const [mounted, setMounted] = createSignal(false);
  let minRef: HTMLInputElement;
  let secRef: HTMLInputElement;

  createEffect(() => {
    const min = minutes() || 0;
    const sec = seconds() || 0;

    if (!untrack(mounted)) {
      setMounted(true);
      return;
    }

    const newVal = min * 60 + sec;
    props.saveFunc(newVal).then(() => props.onValueChange(newVal));
  });

  return (
    <div class="px-1 flex items-center">
      <NumberInput
        width="1.8rem"
        maxValue={props.maxMinutes ?? 999}
        minValue={0}
        inputProps={{
          ref: (el) => (minRef = el),
          value: minutes(),
          onInput: (e) => {
            if (e.currentTarget.value.includes(".")) {
              e.currentTarget.value = e.currentTarget.value.replace(".", "");
              setTimesEnteredMinutes(0);
              secRef?.focus();
              return;
            }

            const raw = parseInt(e.currentTarget.value) || 0;
            const clamped = Math.max(0, Math.min(raw, 999));

            if (clamped !== raw) {
              e.currentTarget.value = clamped.toString();
            }

            setTimesEnteredMinutes(timesEnteredMinutes() + 1);
            if (timesEnteredMinutes() >= (props.maxMinutes ?? 999).toString().length) {
              secRef.focus();
            }
            setMinutes(clamped);
          },
          onBlur: (e) => {
            setTimesEnteredMinutes(0);
          },
        }}
      />
      <p>:</p>
      <NumberInput
        width="1.2rem"
        maxValue={59}
        minValue={0}
        inputProps={{
          ref: (el) => (secRef = el),
          value: seconds().toString().padStart(2, "0"),
          onInput: (e) => {
            const raw = parseInt(e.currentTarget.value) || 0;
            const clamped = Math.min(59, Math.max(0, raw));

            if (clamped !== raw) {
              e.currentTarget.value = clamped.toString();
            }

            setTimesEnteredSeconds(timesEnteredSeconds() + 1);
            if (timesEnteredSeconds() >= 2) {
              secRef.blur();
            }
            setSeconds(clamped);
          },
          onBlur: (e) => {
            setTimesEnteredSeconds(0);
          },
        }}
      />
    </div>
  );
};

export default DataTime;
