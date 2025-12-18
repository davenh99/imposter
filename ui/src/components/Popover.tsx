import { Component } from "solid-js";
import Info from "lucide-solid/icons/info";
import { Popover as KPopover } from "@kobalte/core/popover";

interface Props {
  msg: string;
}

export const Popover: Component<Props> = (props) => {
  return (
    <KPopover>
      <KPopover.Trigger class="ml-1 inline-flex items-center text-ash-gray-500 hover:opacity-80 transition-colors">
        <Info size={16} />
      </KPopover.Trigger>

      <KPopover.Portal>
        <KPopover.Content
          class="
            z-50 px-3 py-2 rounded-lg text-sm leading-snug
            bg-charcoal-700 text-ash-gray-50 shadow-xl border border-charcoal-600
            max-w-[200px] break-words whitespace-normal
            animate-fade-in-up
          "
        >
          <KPopover.Arrow class="fill-charcoal-700" />
          {props.msg}
        </KPopover.Content>
      </KPopover.Portal>
    </KPopover>
  );
};

export default Popover;
