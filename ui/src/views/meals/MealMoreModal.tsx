import { Component, createEffect } from "solid-js";
import { createStore, SetStoreFunction } from "solid-js/store";
import Copy from "lucide-solid/icons/copy";
import Delete from "lucide-solid/icons/x";

import {
  Button,
  Input,
  NumberInput,
  Modal,
  TagArea,
  TextArea,
  useModalLoading,
  Checkbox,
} from "../../components";
import { useAuthPB } from "../../config/pocketbase";

interface Props {
  setModalVisible: (visible: boolean) => void;
  initialMeal: SessionMealsRecordExpand;
  sessionID: string;
  setSession: SetStoreFunction<{
    session: SessionsRecordExpand | null;
  }>;
  deleteRow: () => Promise<void>;
  duplicateRow: () => Promise<void>;
}

export const MealMoreModal: Component<Props> = (props) => {
  const [meal, setMeal] = createStore(JSON.parse(JSON.stringify(props.initialMeal)));
  const { pb, getSessionByID } = useAuthPB();

  const save = async () => {
    try {
      await pb.collection("sessionMeals").update(meal.id, meal);
      // lazy way to refresh the session for now. could also set the state.
      const updatedSession = await getSessionByID(props.sessionID);
      props.setSession({ session: updatedSession });
    } catch (e) {
      console.error(e);
    }
  };

  createEffect(() => setMeal(JSON.parse(JSON.stringify(props.initialMeal))));

  return (
    <Modal saveFunc={save} setModalVisible={() => props.setModalVisible(false)}>
      <ModalContent meal={meal} setMeal={setMeal} parentProps={props} />
    </Modal>
  );
};

export default MealMoreModal;

interface ModalProps {
  meal: SessionMealsRecordExpand;
  setMeal: SetStoreFunction<SessionMealsRecordExpand>;
  parentProps: Props;
}

const ModalContent: Component<ModalProps> = (props) => {
  const { setLoading } = useModalLoading();
  return (
    <div class="overflow-y-auto space-y-1">
      <h2 class="pb-2">Meal Options</h2>
      <Checkbox
        checked={props.meal.saved ?? false}
        onChange={(v) => props.setMeal("saved", v)}
        label="Save meal"
      />
      <Input label="Name" value={props.meal.name} onChange={(v) => props.setMeal("name", v)} />
      <TextArea
        label="Description"
        value={props.meal.description}
        onChange={(v) => props.setMeal("description", v)}
        inputProps={{
          placeholder: "My go-to lunch...",
        }}
      />
      <div class="flex space-x-1">
        <NumberInput
          label="Energy"
          rawValue={props.meal.kj}
          class="flex-1 justify-between"
          width="3.5rem"
          onRawValueChange={(v) => props.setMeal("kj", v)}
          inputProps={{
            class: "rounded-sm bg-charcoal-600 pr-0.5",
          }}
        />
        <p class="w-4">kj</p>
      </div>
      <div class="flex space-x-1">
        <NumberInput
          label="Protein"
          class="flex-1 justify-between"
          width="3.5rem"
          rawValue={props.meal.gramsProtein}
          onRawValueChange={(v) => props.setMeal("gramsProtein", v)}
          inputProps={{
            class: "rounded-sm bg-charcoal-600 pr-0.5",
          }}
        />
        <p class="w-4">g</p>
      </div>
      <div class="flex space-x-1">
        <NumberInput
          label="Carbohydrates"
          class="flex-1 justify-between"
          width="3.5rem"
          rawValue={props.meal.gramsCarbohydrate}
          onRawValueChange={(v) => props.setMeal("gramsCarbohydrate", v)}
          inputProps={{
            class: "rounded-sm bg-charcoal-600 pr-0.5",
          }}
        />
        <p class="w-4">g</p>
      </div>
      <div class="flex space-x-1 mb-1.5">
        <NumberInput
          label="Fats"
          class="flex-1 justify-between"
          width="3.5rem"
          rawValue={props.meal.gramsFat}
          onRawValueChange={(v) => props.setMeal("gramsFat", v)}
          inputProps={{
            class: "rounded-sm bg-charcoal-600 pr-0.5",
          }}
        />
        <p class="w-4">g</p>
      </div>
      <TagArea
        tags={props.meal.expand?.tags ?? []}
        setTags={(tags) => {
          props.setMeal("expand", "tags", tags);
          props.setMeal(
            "tags",
            tags.map((t) => t.id)
          );
        }}
        modelName="sessionMeals"
        recordID={props.meal.id}
      />
      <div class="flex flex-col mt-3">
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
