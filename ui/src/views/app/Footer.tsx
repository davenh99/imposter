import { ParentComponent } from "solid-js";

interface Props {
  class?: string;
}

const Footer: ParentComponent<Props> = (props) => {
  return (
    <footer
      class={`flex flex-col items-center py-4 bg-charcoal-300 
        text-dark-slate-gray-900 ${props.class ?? ""}`}
    >
      {props.children}
    </footer>
  );
};

export default Footer;
