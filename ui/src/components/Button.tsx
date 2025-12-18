import { ParentComponent, splitProps, createMemo, ValidComponent } from "solid-js";
import { A } from "@solidjs/router";
import { ButtonRootProps, Button as KobalteButton } from "@kobalte/core/button";
import { tv } from "tailwind-variants";
import { PolymorphicProps } from "@kobalte/core";

type BaseProps<T extends ValidComponent = "button" | "A"> = PolymorphicProps<T, ButtonRootProps<T>>;

interface Props extends BaseProps {
  onClick?: () => void;
  href?: string;
  variant?: "text" | "solid";
  variantColor?: "good" | "bad" | "neutral";
}

const button = tv({
  base: "font-bold active:opacity-80",
  variants: {
    variant: {
      text: "px-1",
      solid: "rounded-md px-3 py-1 border-1",
    },
    variantColor: {
      good: "text-green-400",
      bad: "text-red-400",
      neutral: "text-charcoal-800",
    },
  },
  compoundVariants: [
    {
      variant: "solid",
      variantColor: "good",
      class: "bg-green-400/20",
    },
    {
      variant: "solid",
      variantColor: "bad",
      class: "bg-red-400/20",
    },
    {
      variant: "solid",
      variantColor: "neutral",
      class: "bg-charcoal-800/20",
    },
  ],
  defaultVariants: {
    variant: "solid",
    variantColor: "neutral",
  },
});

export const Button: ParentComponent<Props> = (props) => {
  const [local, others] = splitProps(props, [
    "children",
    "href",
    "onClick",
    "class",
    "variant",
    "variantColor",
  ]);

  const classes = createMemo(() =>
    button({
      variant: local.variant,
      variantColor: local.variantColor,
      class: local.class as string,
    })
  );

  return (
    <KobalteButton
      as={local.href ? A : "button"}
      href={local.href ?? ""}
      onClick={local.onClick}
      class={classes()}
      {...others}
    >
      {local.children}
    </KobalteButton>
  );
};

export default Button;
