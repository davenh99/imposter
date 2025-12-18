import { Component, createEffect, createSignal, Show } from "solid-js";
import { createStore, SetStoreFunction } from "solid-js/store";
import Plus from "lucide-solid/icons/plus";
import Copy from "lucide-solid/icons/copy";
import Delete from "lucide-solid/icons/x";
import ArrowUp from "lucide-solid/icons/arrow-up-right";

import { Button, Checkbox, Modal, TextArea, useModalLoading } from "../../components";
import { useAuthPB } from "../../config/pocketbase";
import ExerciseSelectModal from "../exercises/ExerciseSelectModal";

interface Props {
  setModalVisible: (visible: boolean) => void;
  initialExercise: RoutineExercisesRecordExpand;
  routineId: string;
  setRoutine: SetStoreFunction<{
    routine: RoutinesRecordExpand | null;
  }>;
  deleteRow: () => Promise<void>;
  duplicateRow: () => Promise<void>;
  addDropSet: () => Promise<void>;
}

export const RoutineExerciseMoreModal: Component<Props> = (props) => {
  const [exercise, setExercise] = createStore(JSON.parse(JSON.stringify(props.initialExercise)));
  const { pb, getRoutineByID } = useAuthPB();

  const save = async () => {
    try {
      await pb.collection("routineExercises").update(exercise.id, exercise);
      // lazy way to refresh the routine for now. could also set the state.
      const updatedRoutine = await getRoutineByID(props.routineId);
      props.setRoutine({ routine: updatedRoutine });
    } catch (e) {
      console.error(e);
    }
  };

  createEffect(() => {
    setExercise(JSON.parse(JSON.stringify(props.initialExercise)));
  });

  return (
    <Modal saveFunc={save} setModalVisible={props.setModalVisible}>
      <ModalContent exercise={exercise} setExercise={setExercise} parentProps={props} />
    </Modal>
  );
};

export default RoutineExerciseMoreModal;

interface ModalProps {
  exercise: RoutineExercisesRecordExpand;
  setExercise: SetStoreFunction<RoutineExercisesRecordExpand>;
  parentProps: Props;
}

const ModalContent: Component<ModalProps> = (props) => {
  const [showExerciseSelectModal, setShowExerciseSelectModal] = createSignal(false);
  const [warning, setWarning] = createSignal("");
  const { setLoading } = useModalLoading();

  const selectNewExercise = async (exercise: ExercisesRecordExpand) => {
    props.setExercise("exercise", exercise.id);
    props.setExercise("expand", (currentExpand: any) => ({
      ...currentExpand,
      exercise: { ...currentExpand?.exercise, name: exercise.name },
    }));
    props.setExercise("measurementNumeric", 0);
    props.setExercise("measurement2Numeric", 0);
    props.setExercise("measurement3Numeric", 0);
    props.setExercise("measurementValue", undefined);
    props.setExercise("measurement2Value", undefined);
    props.setExercise("measurement3Value", undefined);

    setWarning("Warning: changing the exercise will reset measurements");
    setShowExerciseSelectModal(false);
  };

  return (
    <div class="overflow-y-auto">
      <Show when={showExerciseSelectModal()}>
        <ExerciseSelectModal
          setModalVisible={setShowExerciseSelectModal}
          selectExercise={selectNewExercise}
        />
      </Show>
      <h2 class="pb-2">Exercise Options</h2>
      <div class="mb-3">
        <Button class="w-full flex items-center" onClick={() => setShowExerciseSelectModal(true)}>
          <p class="flex-1">{props.exercise.expand?.exercise?.name}</p>
          <ArrowUp size={18} />
        </Button>
        <p class="pt-1 text-red-400 text-xs">{warning()}</p>
      </div>
      <Checkbox
        checked={props.exercise.isWarmup || false}
        onChange={(v) => props.setExercise("isWarmup", v)}
        label="Mark as warmup"
      />
      <TextArea
        class="my-2"
        label="Notes"
        value={props.exercise.notes}
        onChange={(v) => props.setExercise("notes", v)}
        inputProps={{
          placeholder: "Feeling strong...",
        }}
      />
      <div class="flex flex-col mt-3">
        <Button
          variant="text"
          class="flex flex-row items-center space-x-1"
          onClick={async () => {
            setLoading(true);
            await props.parentProps.addDropSet();
            props.parentProps.setModalVisible(false);
            setLoading(false);
          }}
        >
          <Plus size={16} />
          <p>Add Drop Set</p>
        </Button>
        <Button
          variant="text"
          class="flex flex-row items-center space-x-1"
          onClick={async () => {
            setLoading(true);
            await props.parentProps.duplicateRow();
            props.parentProps.setModalVisible(false);
            setLoading(false);
          }}
        >
          <Copy size={16} />
          <p>Duplicate</p>
        </Button>
        <Button
          variant="text"
          variantColor="bad"
          class="flex flex-row items-center space-x-1"
          onClick={async () => {
            setLoading(true);
            await props.parentProps.deleteRow();
            props.parentProps.setModalVisible(false);
            setLoading(false);
          }}
        >
          <Delete size={16} />
          <p>Delete</p>
        </Button>
      </div>
      <div class="bg-dark-slate-gray-500 w-full h-[2px] my-2 rounded-full"></div>
    </div>
  );
};
