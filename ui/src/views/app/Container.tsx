import { createMemo, ParentComponent } from "solid-js";
import { tv } from "tailwind-variants";

interface Props {
  class?: string;
}

const container = tv({
  base: "flex-1 text-dark-slate-gray-900 py-4 px-[3vw]",
});

const Container: ParentComponent<Props> = (props) => {
  const classes = createMemo(() =>
    container({
      class: props.class,
    })
  );

  return <div class={classes()}>{props.children}</div>;
};

export default Container;
