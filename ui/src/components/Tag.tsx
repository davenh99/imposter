import { Component, createMemo } from "solid-js";
import { Button as KobalteButton } from "@kobalte/core/button";
import CloseIcon from "lucide-solid/icons/x";
import { tv } from "tailwind-variants";

export type TagSize = "xs" | "s" | "m";

interface Props {
  onClick: () => void;
  title: string;
  colorHex: string;
  size?: TagSize;
  class?: string;
}

const tag = tv({
  base: "flex items-center rounded-full select-none border-1 font-bold",
  variants: {
    size: {
      m: "text-sm px-2 py-1",
      s: "text-sm pl-1.5 pr-1 py-0.5",
      xs: "text-xs px-1",
    },
  },
  defaultVariants: {
    size: "m",
  },
});

export const Tag: Component<Props> = (props) => {
  const classes = createMemo(() =>
    tag({
      size: props.size,
      class: props.class,
    })
  );

  return (
    <div style={{ "background-color": `${props.colorHex}30`, color: `${props.colorHex}` }} class={classes()}>
      <span>{props.title}</span>
      <KobalteButton onClick={props.onClick} class="pl-1 flex items-center justify-center">
        <CloseIcon size={14} />
      </KobalteButton>
    </div>
  );
};

export default Tag;
