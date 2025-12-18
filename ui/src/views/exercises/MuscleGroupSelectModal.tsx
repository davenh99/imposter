import { Component } from "solid-js";

import { Modal } from "../../components";
import MuscleGroupList from "./MuscleGroupList";

interface Props {
  setModalVisible: (v: boolean) => void;
  selectMuscleGroup: (muscleGroup: { name: string }) => void;
}

export const MuscleGroupSelectModal: Component<Props> = (props) => {
  return (
    <Modal setModalVisible={props.setModalVisible} zIndexClass="z-70" title="Select Muscle Group">
      <MuscleGroupList
        onClick={(muscleGroup) => {
          props.selectMuscleGroup(muscleGroup);
          props.setModalVisible(false);
        }}
      />
    </Modal>
  );
};

export default MuscleGroupSelectModal;
