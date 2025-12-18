import { Component } from "solid-js";

import { Modal } from "../../components";
import { MeasurementTypeList } from "./MeasurementTypeList";

interface Props {
  setModalVisible: (v: boolean) => void;
  selectMeasurementType: (measurementType: MeasurementTypesExpand) => void;
}

export const MeasurementTypeSelectModal: Component<Props> = (props) => {
  return (
    <Modal setModalVisible={props.setModalVisible} zIndexClass="z-70" title="Select Measurement Type">
      <MeasurementTypeList
        onClick={(measurementType: MeasurementTypesExpand) => {
          props.selectMeasurementType(measurementType);
          props.setModalVisible(false);
        }}
      />
    </Modal>
  );
};

export default MeasurementTypeSelectModal;
