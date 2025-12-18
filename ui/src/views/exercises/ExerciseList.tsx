import { Accessor, Component, createMemo, createSignal, Show } from "solid-js";
import { ColumnDef } from "@tanstack/solid-table";
import ArrowRight from "lucide-solid/icons/arrow-right";
import Filter from "lucide-solid/icons/list-filter-plus";
import { useNavigate } from "@solidjs/router";

import { Button, Tag } from "../../components";
import EquipmentSelectModal from "./EquipmentSelectModal";
import MuscleGroupSelectModal from "./MuscleGroupSelectModal";
import List from "../app/List";
import { useStore } from "../../config/store";
import { useAuthPB } from "../../config/pocketbase";

interface Props {
  onClick: (exercise: ExercisesRecordExpand) => void;
  containerClass?: string;
  selectedMuscleGroup: Accessor<string>;
  setSelectedMuscleGroup: (val: string) => void;
  filterSaved: Accessor<boolean>;
  setFilterSaved: (val: boolean) => void;
  selectedEquipment: Accessor<string>;
  selectedEquipmentName: Accessor<string>;
  setSelectedEquipment: (val: EquipmentsRecord | undefined) => void;
}

export const ExerciseList: Component<Props> = (props) => {
  const { exercises, fetchAllExercises } = useStore();
  const [showEquipmentSelect, setShowEquipmentSelect] = createSignal(false);
  const [showMuscleGroupSelect, setShowMuscleGroupSelect] = createSignal(false);
  const navigate = useNavigate();
  const { pb, user, getExerciseByName } = useAuthPB();

  const createExercise = async () => {
    const baseName = `${user.name}'s exercise`;
    let name = baseName;
    let duplicateCount = 0;

    // TODO yikes, do something else probably, need to move this backend
    while (await getExerciseByName(name)) {
      duplicateCount += 1;
      name = `${baseName} (${duplicateCount})`;
    }

    const baseExercise = { name, createdBy: user.id };

    try {
      // TODO maybe better to have below in backend transaction? not urgent
      const exercise = await pb.collection<ExercisesRecord>("exercises").create(baseExercise);
      await pb
        .collection<ExercisePreferencesRecord>("exercisePreferences")
        .create({ exercise: exercise.id, user: user.id, saved: true });

      fetchAllExercises();
      navigate(`/exercises?exerciseId=${exercise.id}&editing=1`);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredData = createMemo(() => {
    return exercises.data.filter((item) => {
      let validRow = true;

      if (
        !!props.selectedEquipment() &&
        !(
          item.equipmentPrimary?.includes(props.selectedEquipment()) ||
          item.equipmentSecondary?.includes(props.selectedEquipment())
        )
      ) {
        validRow = false;
      }

      if (!!props.selectedMuscleGroup() && !(item.targetMuscleGroup === props.selectedMuscleGroup())) {
        validRow = false;
      }

      if (props.filterSaved() && !item.expand?.exercisePreferences_via_exercise?.[0].saved) {
        validRow = false;
      }

      return validRow;
    });
  });

  const columns = createMemo<ColumnDef<ExercisesRecord>[]>(() => [
    {
      accessorKey: "name",
      header: "Exercise",
      cell: (ctx) => (
        <div class="flex justify-between">
          <div class="flex-1 truncate">{ctx.getValue() as Element}</div>
          <ArrowRight class="self-end" />
        </div>
      ),
    },
  ]);

  return (
    <>
      <Show when={showEquipmentSelect()}>
        <EquipmentSelectModal
          setModalVisible={setShowEquipmentSelect}
          selectEquipment={props.setSelectedEquipment}
        />
      </Show>
      <Show when={showMuscleGroupSelect()}>
        <MuscleGroupSelectModal
          setModalVisible={setShowMuscleGroupSelect}
          selectMuscleGroup={(m) => props.setSelectedMuscleGroup(m.name)}
        />
      </Show>
      <List<ExercisesRecordExpand>
        headerActions={
          <>
            <div class="flex items-center space-x-2 mt-2 mb-1">
              <Button
                class="flex-1 py-0 flex items-center space-x-1 justify-center"
                onClick={() => setShowEquipmentSelect(true)}
              >
                <Filter size={16} />
                <span>Equipment</span>
              </Button>
              <Button
                class="flex-1 py-0 flex items-center space-x-1 justify-center"
                onClick={() => setShowMuscleGroupSelect(true)}
              >
                <Filter size={16} />
                <span>Muscles</span>
              </Button>
              <Button
                class="flex-1 py-0 flex items-center space-x-1 justify-center"
                onClick={() => props.setFilterSaved(!props.filterSaved())}
                variantColor={props.filterSaved() ? "good" : "neutral"}
              >
                <Filter size={16} />
                <span>Saved</span>
              </Button>
            </div>
            <div class="flex items-center space-x-2 mt-2 mb-1 flex-wrap">
              <Show when={!!props.selectedEquipment()}>
                <Tag
                  title={`Equipment: ${props.selectedEquipmentName()!}`}
                  colorHex="#4ADE80"
                  onClick={() => props.setSelectedEquipment(undefined)}
                  size="s"
                />
              </Show>
              <Show when={!!props.selectedMuscleGroup()}>
                <Tag
                  title={`Muscles: ${props.selectedMuscleGroup()}`}
                  colorHex="#4ADE80"
                  onClick={() => props.setSelectedMuscleGroup("")}
                  size="s"
                />
              </Show>
            </div>
          </>
        }
        data={filteredData}
        columns={columns}
        onRowClick={props.onClick}
        showItemCount
        loading={exercises.loading}
        containerClass={props.containerClass}
        createFunc={createExercise}
        search
      />
    </>
  );
};
