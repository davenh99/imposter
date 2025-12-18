import { Component } from "solid-js";
import { useNavigate } from "@solidjs/router";

import { Routine, RoutineCreateData } from "../../../Types";
import { Modal } from "../../components";
import { RoutineList } from "./RoutineList";
import { useAuthPB } from "../../config/pocketbase";
import { ROUTINE_EXPAND } from "../../../constants";

interface Props {
  setModalVisible: (v: boolean) => void;
  addRoutine: (routine: RoutinesRecordExpand) => Promise<void>;
}

export const RoutineSelectModal: Component<Props> = (props) => {
  const navigate = useNavigate();
  const { pb, user } = useAuthPB();

  const createRoutine = async () => {
    const createData: RoutineCreateData = {
      name: "Routine",
      description: "",
      user: user.id,
      exercisesOrder: [],
    };
    try {
      const newRoutine = await pb
        .collection<Routine>("routines")
        .create(createData, { expand: ROUTINE_EXPAND });

      navigate(`/routines?routineId=${newRoutine.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Modal setModalVisible={props.setModalVisible}>
      <h2 class="pb-2">Select Routine</h2>
      <RoutineList onClick={props.addRoutine} createRoutine={createRoutine} />
    </Modal>
  );
};

export default RoutineSelectModal;
