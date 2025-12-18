import { createSignal, ParentComponent, Show, useContext } from "solid-js";
import { Portal } from "solid-js/web";

import { Button } from "./";
import LoadFullScreen from "../views/app/LoadFullScreen";
import { ModalContext } from "./modalContext";

interface Props {
  setModalVisible: (v: boolean) => void;
  saveFunc?: () => Promise<void>;
  zIndexClass?: string;
  title?: string;
}

export const Modal: ParentComponent<Props> = (props) => {
  const [loading, setLoading] = createSignal(false);

  const containerStyle = `${
    props.zIndexClass !== undefined ? props.zIndexClass : "z-50"
  } fixed inset-0 flex items-center justify-center bg-black/50`;

  return (
    <Portal>
      <Show when={loading()}>
        <LoadFullScreen />
      </Show>
      <div class={containerStyle} onClick={() => props.setModalVisible(false)}>
        <div
          class={`bg-charcoal-500 text-dark-slate-gray-900 rounded-xl shadow-lg p-4 md:p-6
              w-full mx-3 sm:w-[50vw] lg:w-[35vw] flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          <Show when={props.title}>
            <h2 class="pb-2">{props.title}</h2>
          </Show>
          <div class="max-h-[55vh] overflow-y-hidden flex flex-col h-full">
            <ModalContext.Provider value={{ loading, setLoading }}>{props.children}</ModalContext.Provider>
          </div>
          <div class="w-full flex justify-end space-x-2">
            <Button onClick={() => props.setModalVisible(false)} class="mt-3">
              Cancel
            </Button>

            <Show when={props.saveFunc}>
              <Button
                variantColor="good"
                onClick={() => {
                  setLoading(true);
                  props.saveFunc!()
                    .then(() => props.setModalVisible(false))
                    .finally(() => setLoading(false));
                }}
                class="mt-3"
              >
                Save
              </Button>
            </Show>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default Modal;

export function useModalLoading() {
  const context = useContext(ModalContext);

  if (!context) {
    throw new Error("useModalLoading must be used within a Modal");
  }

  return context;
}
