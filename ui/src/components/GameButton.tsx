import { ParentComponent } from "solid-js";

interface GameButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "green" | "red";
  class?: string;
}

export const GameButton: ParentComponent<GameButtonProps> = (props) => {
  const baseStyle =
    "font-bold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyle = {
    primary: "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg",
    secondary: "bg-pink-500 text-white hover:bg-pink-600",
    green: "bg-emerald-500 text-white hover:bg-emerald-600",
    red: "bg-orange-500 text-white hover:bg-orange-600",
  };

  return (
    <button
      onClick={props.onClick}
      disabled={props.disabled}
      class={`${baseStyle} ${variantStyle[props.variant || "primary"]} ${props.class || ""}`}
    >
      {props.children}
    </button>
  );
};
