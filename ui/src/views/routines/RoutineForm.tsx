import { Component, createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";
import Delete from "lucide-solid/icons/x";

import { AlertDialog, Button, TextArea, Input } from "../../components";
import RoutineExerciseList from "./RoutineExerciseList";
import { useAuthPB } from "../../config/pocketbase";
import { SetStoreFunction } from "solid-js/store";

interface Props {
  routine: RoutinesRecordExpand;
  setRoutine: SetStoreFunction<{
    routine: RoutinesRecordExpand | null;
  }>;
}

export const RoutineForm: Component<Props> = (props) => {
  const [dialogOpen, setDialogOpen] = createSignal(false);
  const { pb, updateRecord } = useAuthPB();
  const navigate = useNavigate();

  const routineUpdate = async (field: string, newVal: any) => {
    return await updateRecord<RoutinesRecordExpand>("routines", props.routine.id, field, newVal);
  };

  const deleteRoutine = async () => {
    try {
      await pb.collection("routines").delete(props.routine.id);
      navigate("/routines");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <Input
        label="Name"
        class="mb-3"
        labelPosition="above"
        value={props.routine.name}
        saveFunc={async (v) => v && (await routineUpdate("name", v))}
        onChange={(v) => props.setRoutine("routine", "name", v)}
      />
      <TextArea
        label="Description"
        value={props.routine.description || ""}
        saveFunc={(v) => routineUpdate("description", v)}
        onChange={(v) => props.setRoutine("routine", "description", v)}
      />
      <div class="mb-3">
        <p class="mt-3">Exercises</p>
        <RoutineExerciseList
          routineExercises={props.routine.expand?.routineExercises_via_routine ?? []}
          routineId={props.routine.id ?? ""}
          setRoutine={props.setRoutine}
        />
      </div>
      <AlertDialog
        title="Delete Routine"
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        decsription="Are you sure you want to delete this routine?"
        buttons={
          <>
            <Button
              variantColor="bad"
              onClick={() => {
                deleteRoutine();
                setDialogOpen(false);
              }}
            >
              Delete
            </Button>
            <Button variantColor="neutral" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <Button class="flex items-center space-x-1 w-full justify-center" variantColor="bad" variant="text">
          <Delete size={20} />
          <span>Delete Routine</span>
        </Button>
      </AlertDialog>
    </>
  );
};
