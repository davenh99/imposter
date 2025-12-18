import { Accessor, Component, createSignal, For, onMount, Setter, Show } from "solid-js";
import { createStore, SetStoreFunction } from "solid-js/store";
import Delete from "lucide-solid/icons/x";
import { useNavigate } from "@solidjs/router";

import {
  Button,
  DataCheckbox,
  TextArea,
  TagArea,
  Input,
  Checkbox,
  Select,
  AlertDialog,
} from "../../components";
import { useAuthPB } from "../../config/pocketbase";
import LoadFullScreen from "../app/LoadFullScreen";
import { debounce } from "../../methods/debounce";
import EquipmentSelectModal from "./EquipmentSelectModal";
import MeasurementTypeSelectModal from "./MeasurementTypeSelectModal";
import { useStore } from "../../config/store";
import { ExercisesSelectOptions } from "../../../selectOptions";

type ExerciseSelectField = keyof typeof ExercisesSelectOptions;

interface Props {
  exercise: ExercisesRecordExpand;
  editing: boolean;
  setEditing: (v: boolean) => void;
  setChangedPreferences: Setter<boolean>;
}

interface Field {
  title: string;
  component: string;
}

const fieldTitles: Record<
  keyof Omit<
    ExercisesRecord,
    | "id"
    | "created"
    | "updated"
    | "allowedMeasurementTypes"
    | "allowedMeasurementTypes3"
    | "allowedMeasurementTypes2"
    | "collectionId"
    | "collectionName"
    | "public"
    | "defaultMeasurementType3"
    | "image"
    | "video"
    | "usersSaved"
    | "name"
    | "system"
    | "description"
    | "instructions"
    | "equipmentPrimary"
    | "equipmentSecondary"
    | "defaultMeasurementType"
    | "defaultMeasurementType2"
    | "createdBy"
  >,
  Field
> = {
  isTimeBased: { title: "Is the exercise time based?", component: "checkbox" },
  armCount: { title: "One or two arms?", component: "select" },
  armPattern: { title: "Continuous or alternating arms", component: "select" },
  bodyRegion: { title: "Body region", component: "select" },
  bodyweight: { title: "Is this exercise bodyweight based?", component: "checkbox" },
  difficulty: { title: "Difficulty", component: "select" },
  endLoadPosition: { title: "Load position at end", component: "select" },
  field: { title: "Exercise classification", component: "select" },
  footElevation: { title: "Foot elevation", component: "select" },
  forceType: { title: "Force type", component: "select" },
  grip: { title: "Grip", component: "select" },
  isCombination: { title: "Combination exercise?", component: "checkbox" },
  laterality: { title: "Laterality", component: "select" },
  legPattern: { title: "Continuous or alternating legs", component: "select" },
  mechanics: { title: "Mechanics", component: "select" },
  motionPlane: { title: "Plane of motion #1", component: "select" },
  motionPlane2: { title: "Plane of motion #2", component: "select" },
  motionPlane3: { title: "Plane of motion #3", component: "select" },
  movementPattern: { title: "Movement pattern #1", component: "select" },
  movementPattern2: { title: "Movement pattern #2", component: "select" },
  movementPattern3: { title: "Movement pattern #3", component: "select" },
  musclePrimary: { title: "Primary muscle", component: "select" },
  muscleSecondary: { title: "Secondary muscle", component: "select" },
  muscleTertiary: { title: "Tertiary muscle", component: "select" },
  posture: { title: "Posture", component: "select" },
  targetMuscleGroup: { title: "Target muscle group", component: "select" },
};

export const ExerciseForm: Component<Props> = (props) => {
  const [loading, setLoading] = createSignal(false);
  const [exercise, setExercise] = createStore<ExercisesRecordExpand>(props.exercise);

  return (
    <div class="pb-25">
      <Show
        when={props.editing}
        fallback={
          <ViewingContent
            exercise={exercise}
            editing={props.editing}
            setEditing={props.setEditing}
            setChangedPreferences={props.setChangedPreferences}
          />
        }
      >
        <EditingContent
          exercise={exercise}
          loading={loading}
          setLoading={setLoading}
          setExercise={setExercise}
          editing={props.editing}
          setEditing={props.setEditing}
        />
      </Show>
    </div>
  );
};

interface EditContentProps extends Omit<Props, "setChangedPreferences"> {
  setExercise: SetStoreFunction<ExercisesRecordExpand>;
  loading: Accessor<boolean>;
  setLoading: (v: boolean) => void;
}

interface MeasurementTypeModalShowOptions {
  show: boolean;
  key: "defaultMeasurementType" | "defaultMeasurementType2";
}

interface EquipmentModalShowOptions {
  show: boolean;
  key: "equipmentPrimary" | "equipmentSecondary";
}

const EditingContent: Component<EditContentProps> = (props) => {
  const [dialogOpen, setDialogOpen] = createSignal(false);
  const { fetchAllExercises } = useStore();
  const [showEquipmentSelect, setShowEquipmentSelect] = createSignal<EquipmentModalShowOptions>({
    show: false,
    key: "equipmentPrimary",
  });
  const [showMeasurementTypeSelect, setShowMeasurementTypeSelect] =
    createSignal<MeasurementTypeModalShowOptions>({
      show: false,
      key: "defaultMeasurementType",
    });
  const { pb } = useAuthPB();
  const navigate = useNavigate();

  const saveExercise = async () => {
    props.setLoading(true);
    try {
      await pb.collection("exercises").update(props.exercise.id, props.exercise);
      fetchAllExercises();
    } catch (e) {
      console.error(e);
    }
    props.setLoading(false);
    props.setEditing(false);
  };

  const deleteExercise = async () => {
    try {
      await pb.collection("exercises").delete(props.exercise.id);
      fetchAllExercises();
      navigate("/exercises");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <Show when={props.loading()}>
        <LoadFullScreen />
      </Show>
      <Show when={showEquipmentSelect().show}>
        <EquipmentSelectModal
          setModalVisible={(v) => setShowEquipmentSelect({ ...showEquipmentSelect(), show: v })}
          selectEquipment={(v) => {
            props.setExercise("expand", showEquipmentSelect().key, v);
            props.setExercise(showEquipmentSelect().key, v.id);
          }}
        />
      </Show>
      <Show when={showMeasurementTypeSelect().show}>
        <MeasurementTypeSelectModal
          setModalVisible={(v) => setShowMeasurementTypeSelect({ ...showMeasurementTypeSelect(), show: v })}
          selectMeasurementType={(v) => {
            props.setExercise("expand", showMeasurementTypeSelect().key, v);
            props.setExercise(showMeasurementTypeSelect().key, v.id);
          }}
        />
      </Show>
      <div class="flex justify-end items-start">
        <Button variant="text" variantColor="good" onClick={saveExercise}>
          save
        </Button>
      </div>
      <div class="space-y-2">
        <Input
          value={props.exercise.name}
          label="Exercise Name"
          labelPosition="above"
          onChange={(v) => props.setExercise("name", v)}
        />
        <TextArea
          value={props.exercise.description}
          label="Description"
          onChange={(v) => props.setExercise("description", v)}
        />
        <TextArea
          value={props.exercise.instructions}
          label="Instructions"
          onChange={(v) => props.setExercise("instructions", v)}
        />

        <div>
          <Show when={props.exercise.expand?.defaultMeasurementType}>
            <p class="text-md font-bold mt-1">Measurement type</p>
          </Show>
          <div class="flex items-center">
            <Button
              class="flex-1 flex items-center space-x-1 justify-center w-full"
              onClick={() => setShowMeasurementTypeSelect({ show: true, key: "defaultMeasurementType" })}
            >
              <span>
                {props.exercise.expand?.defaultMeasurementType
                  ? props.exercise.expand?.defaultMeasurementType?.name
                  : "Measurement type"}
              </span>
            </Button>
            {props.exercise.expand?.defaultMeasurementType && (
              <Button
                variant="text"
                variantColor="bad"
                onClick={() => {
                  props.setExercise("expand", "defaultMeasurementType", undefined);
                  props.setExercise("defaultMeasurementType", "");
                }}
              >
                <Delete />
              </Button>
            )}
          </div>
        </div>

        <div>
          <Show when={props.exercise.expand?.defaultMeasurementType2}>
            <p class="text-md font-bold mt-1">Second measurement type</p>
          </Show>
          <div class="flex items-center">
            <Button
              class="flex-1 flex items-center space-x-1 justify-center w-full"
              onClick={() => setShowMeasurementTypeSelect({ show: true, key: "defaultMeasurementType2" })}
            >
              <span>
                {props.exercise.expand?.defaultMeasurementType2
                  ? props.exercise.expand?.defaultMeasurementType2?.name
                  : "Second measurement type"}
              </span>
            </Button>
            {props.exercise.expand?.defaultMeasurementType2 && (
              <Button
                variant="text"
                variantColor="bad"
                onClick={() => {
                  props.setExercise("expand", "defaultMeasurementType2", undefined);
                  props.setExercise("defaultMeasurementType2", "");
                }}
              >
                <Delete />
              </Button>
            )}
          </div>
        </div>

        <div>
          <Show when={props.exercise.expand?.equipmentPrimary}>
            <p class="text-md font-bold mt-1">Primary equipment</p>
          </Show>
          <div class="flex items-center">
            <Button
              class="flex-1 flex items-center space-x-1 justify-center w-full"
              onClick={() => setShowEquipmentSelect({ show: true, key: "equipmentPrimary" })}
            >
              <span>
                {props.exercise.expand?.equipmentPrimary
                  ? props.exercise.expand?.equipmentPrimary?.name
                  : "Primary Equipment"}
              </span>
            </Button>
            {props.exercise.expand?.equipmentPrimary && (
              <Button
                variant="text"
                variantColor="bad"
                onClick={() => {
                  props.setExercise("expand", "equipmentPrimary", undefined);
                  props.setExercise("equipmentPrimary", "");
                }}
              >
                <Delete />
              </Button>
            )}
          </div>
        </div>

        <div>
          <Show when={props.exercise.expand?.equipmentSecondary}>
            <p class="text-md font-bold mt-1">Secondary equipment</p>
          </Show>
          <div class="flex items-center">
            <Button
              class="flex-1 flex items-center space-x-1 justify-center w-full"
              onClick={() => setShowEquipmentSelect({ show: true, key: "equipmentSecondary" })}
            >
              <span>
                {props.exercise.expand?.equipmentSecondary
                  ? props.exercise.expand?.equipmentSecondary?.name
                  : "Secondary equipment"}
              </span>
            </Button>
            {props.exercise.expand?.equipmentSecondary && (
              <Button
                variant="text"
                variantColor="bad"
                onClick={() => {
                  props.setExercise("expand", "equipmentSecondary", undefined);
                  props.setExercise("equipmentSecondary", "");
                }}
              >
                <Delete />
              </Button>
            )}
          </div>
        </div>

        <For each={Object.entries(fieldTitles) as [keyof typeof fieldTitles, Field][]}>
          {([fieldName, field]) => {
            switch (field.component) {
              case "checkbox":
                return (
                  <div class="mb-2 mt-3">
                    <Checkbox
                      checked={!!props.exercise[fieldName]}
                      label={field.title}
                      onChange={(v) => props.setExercise(fieldName, v)}
                    />
                  </div>
                );
              case "select":
                return (
                  <div class="mb-2">
                    <p class="text-md font-bold mt-1">{field.title}</p>
                    <Select
                      value={props.exercise[fieldName] as string}
                      values={ExercisesSelectOptions[fieldName as ExerciseSelectField] as string[]}
                      // @ts-ignore TODO maybe can type this properly later
                      onChange={(v) => props.setExercise(fieldName, v || "")}
                      placeholder="Select"
                    />
                  </div>
                );
            }
          }}
        </For>
        <AlertDialog
          title="Delete Exercise"
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          decsription="Are you sure you want to delete this exercise?"
          buttons={
            <>
              <Button
                variantColor="bad"
                onClick={() => {
                  deleteExercise();
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
            <span>Delete Exercise</span>
          </Button>
        </AlertDialog>
      </div>
    </>
  );
};

const ViewingContent: Component<Props> = (props) => {
  const { pb, user, getExercisePreferences } = useAuthPB();
  const [exercisePreferences, setExercisePreferences] = createStore<ExercisePreferencesExpand>({
    user: user.id,
    exercise: props.exercise.id,
    notes: "",
    tags: [],
    saved: false,
    expand: {
      tags: [],
    },
  });

  const savePreferences = debounce(async (field: string, val: any) => {
    const newData: any = {};
    newData[field] = val;

    try {
      const curRecord = await getExercisePreferences(props.exercise.id);

      if (curRecord) {
        await pb.collection<ExercisePreferencesExpand>("exercisePreferences").update(curRecord.id, newData);
      } else {
        await pb
          .collection<ExercisePreferencesExpand>("exercisePreferences")
          .create({ ...exercisePreferences, ...newData });
      }

      props.setChangedPreferences(true);
    } catch (e) {
      console.error(e);
    }
  });

  onMount(async () => {
    const record = await getExercisePreferences(props.exercise.id);
    if (record) {
      setExercisePreferences(record);
    }
  });

  return (
    <>
      <div class="flex justify-between items-start">
        <h2>{props.exercise.name}</h2>
        <Show when={props.exercise.createdBy === user.id}>
          <Button variant="text" variantColor="neutral" onClick={() => props.setEditing(true)}>
            edit
          </Button>
        </Show>
      </div>
      <Show when={props.exercise.description}>
        <p class="text-md font-bold mt-1">Description</p>
        <p class="text-sm whitespace-pre-line">{props.exercise.description}</p>
      </Show>
      <Show when={props.exercise.instructions}>
        <p class="text-md font-bold mt-1">Instructions</p>
        <p class="text-sm whitespace-pre-line">{props.exercise.instructions}</p>
      </Show>
      <div class="mt-3 mb-2">
        <DataCheckbox
          label="Save Exercise"
          value={exercisePreferences.saved || false}
          onValueChange={(v) => setExercisePreferences("saved", v)}
          saveFunc={async (v) => savePreferences("saved", v)}
        />
      </div>
      <div class="mb-2">
        <TextArea
          value={exercisePreferences.notes || ""}
          onChange={(v) => setExercisePreferences("notes", v)}
          saveFunc={async (v) => savePreferences("notes", v)}
          label="Your notes"
        />
      </div>
      <TagArea
        modelName=""
        recordID=""
        tags={exercisePreferences.expand?.tags || []}
        setTags={(tags) => setExercisePreferences("expand", "tags", tags)}
        updateRecord={async (_, __, f, val) => savePreferences(f, val)}
      />
      <h3 class="mt-4">Exercise Info</h3>
      <Show when={props.exercise.expand?.defaultMeasurementType}>
        <p class="text-md font-bold mt-1">Measurement type</p>
        <p class="text-sm">{String(props.exercise.expand?.defaultMeasurementType?.name)}</p>
      </Show>
      <Show when={props.exercise.expand?.defaultMeasurementType2}>
        <p class="text-md font-bold mt-1">Second measurement type</p>
        <p class="text-sm">{String(props.exercise.expand?.defaultMeasurementType2?.name)}</p>
      </Show>
      <Show when={props.exercise.expand?.equipmentPrimary}>
        <p class="text-md font-bold mt-1">Primary equipment</p>
        <p class="text-sm">{String(props.exercise.expand?.equipmentPrimary?.name)}</p>
      </Show>
      <Show when={props.exercise.expand?.equipmentSecondary}>
        <p class="text-md font-bold mt-1">Secondary equipment</p>
        <p class="text-sm">{String(props.exercise.expand?.equipmentSecondary?.name)}</p>
      </Show>
      <For each={Object.entries(fieldTitles) as [keyof typeof fieldTitles, Field][]}>
        {([fieldName, field]) => (
          <Show when={props.exercise[fieldName] !== undefined && props.exercise[fieldName] !== ""}>
            <p class="text-md font-bold mt-1">{field.title}</p>
            <Show
              when={typeof props.exercise[fieldName] === "boolean"}
              fallback={<p class="text-sm">{String(props.exercise[fieldName])}</p>}
            >
              <p class="text-sm">{props.exercise[fieldName] ? "yes" : "no"}</p>
            </Show>
          </Show>
        )}
      </For>
    </>
  );
};

export default ExerciseForm;
