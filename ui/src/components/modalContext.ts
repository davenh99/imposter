import { Accessor, createContext, Setter } from "solid-js";

type ModalContextType = {
  loading: Accessor<boolean>;
  setLoading: Setter<boolean>;
};

export const ModalContext = createContext<ModalContextType>();
