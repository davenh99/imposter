import { ParentComponent } from "solid-js";

const Header: ParentComponent = (props) => {
  return <header class="px-[5vw] py-4 bg-charcoal-300 text-dark-slate-gray-900">{props.children}</header>;
};

export default Header;
