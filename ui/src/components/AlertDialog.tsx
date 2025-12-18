import { AlertDialog as KAlertDialog } from "@kobalte/core/alert-dialog";
import { Accessor, JSX, ParentComponent, Setter } from "solid-js";
import Delete from "lucide-solid/icons/x";

interface Props {
  title: string;
  decsription: string;
  buttons?: JSX.Element;
  open?: Accessor<boolean>;
  onOpenChange?: Setter<boolean>;
}

export const AlertDialog: ParentComponent<Props> = (props) => {
  return (
    <KAlertDialog open={props.open?.()} onOpenChange={props.onOpenChange}>
      <KAlertDialog.Trigger class="w-full">{props.children}</KAlertDialog.Trigger>
      <KAlertDialog.Portal>
        <KAlertDialog.Overlay class="fixed inset-0 z-50 bg-black/20" />
        <div class="flex justify-center items-center fixed inset-0 z-50">
          <KAlertDialog.Content class="z-50 max-w-[90%] p-3 bg-charcoal-600 rounded-lg text-dark-slate-gray-900">
            <div class="flex align-baseline justify-between mb-2">
              <KAlertDialog.Title>{props.title}</KAlertDialog.Title>
              <KAlertDialog.CloseButton>
                <Delete size={20} />
              </KAlertDialog.CloseButton>
            </div>
            <KAlertDialog.Description>{props.decsription}</KAlertDialog.Description>
            <div class="w-full flex justify-end space-x-2 mt-2">{props.buttons}</div>
          </KAlertDialog.Content>
        </div>
      </KAlertDialog.Portal>
    </KAlertDialog>
  );
};

export default AlertDialog;
