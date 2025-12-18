import { Component, createMemo, createSignal } from "solid-js";

import { Modal } from "../../components";
import { ExerciseList } from "./ExerciseList";

interface Props {
  setModalVisible: (v: boolean) => void;
  selectExercise: (exercise: ExercisesRecord) => Promise<void>;
}

export const ExerciseSelectModal: Component<Props> = (props) => {
  const [selectedEquipment, setSelectedEquipment] = createSignal<EquipmentsRecord>();
  const [selectedMuscleGroup, setSelectedMuscleGroup] = createSignal<string>("");
  const [filterSaved, setFilterSaved] = createSignal(false);

  const selectedEquipmentId = createMemo(() => selectedEquipment()?.id || "");
  const selectedEquipmentName = createMemo(() => selectedEquipment()?.name || "");

  return (
    <Modal setModalVisible={props.setModalVisible} zIndexClass="z-60" title="Select Exercise">
      <ExerciseList
        selectedEquipment={selectedEquipmentId}
        selectedEquipmentName={selectedEquipmentName}
        selectedMuscleGroup={selectedMuscleGroup}
        filterSaved={filterSaved}
        setSelectedEquipment={setSelectedEquipment}
        setSelectedMuscleGroup={setSelectedMuscleGroup}
        setFilterSaved={setFilterSaved}
        onClick={(exercise: ExercisesRecord) => props.selectExercise(exercise)}
      />
    </Modal>
  );
};

export default ExerciseSelectModal;
