import { ParentComponent } from "solid-js";
import { Button as KobalteButton } from "@kobalte/core/button";

interface Props {
  onClick: () => void;
}

export const IconButton: ParentComponent<Props> = (props) => {
  return (
    <KobalteButton class="active:opacity-80" onClick={props.onClick}>
      {props.children}
    </KobalteButton>
  );
};

export default IconButton;
