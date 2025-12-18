import { Component, createMemo, createSignal, For, Show } from "solid-js";
import { SetStoreFunction } from "solid-js/store";
import { useAuthPB } from "../../config/pocketbase";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import Ellipsis from "lucide-solid/icons/ellipsis-vertical";
import Plus from "lucide-solid/icons/plus";

import { RoutineExerciseCreateData } from "../../../Types";
import RoutineExerciseMoreModal from "./RoutineExerciseMoreModal";
import ExerciseSelectModal from "../exercises/ExerciseSelectModal";
import { Button, DataTime, IconButton, MultiMeasurementValueSelect, NumberInput } from "../../components";
import { SESSION_EXERCISE_EXPAND } from "../../../constants";
import { getGroupInds, getGroups, getSupersetInds } from "../../methods/sessionExercise";
import { ColumnDef, createSolidTable, getCoreRowModel } from "@tanstack/solid-table";
import RoutineSelectModal from "./RoutineSelectModal";
import { getDropsetAddData } from "../../methods/routineExercise";
import { DraggableRow } from "../exercises/SessionOrRoutineExerciseDraggableRow";
import { createDisposableEffect } from "../../methods/disposable";

interface Props {
  routineExercises: RoutineExercisesRecordExpand[];
  routineId: string;
  setRoutine: SetStoreFunction<{
    routine: RoutinesRecordExpand | null;
  }>;
}

export const RoutineExerciseList: Component<Props> = (props) => {
  const [showCreateRoutineExercise, setShowCreateRoutineExercise] = createSignal(false);
  const [showAddRoutine, setShowAddRoutine] = createSignal(false);
  const [showMoreExercise, setShowMoreExercise] = createSignal(false);
  const [selectedExerciseInd, setSelectedExerciseInd] = createSignal(-1);
  const { pb, updateRecord, routineToSortedExercises } = useAuthPB();
  const groups = createMemo(() => getGroups(props.routineExercises));

  const setNumbers = createMemo(() => {
    const setNumbers = [];
    let curSet = 0;

    for (const se of props.routineExercises) {
      if (se.isWarmup) {
        setNumbers.push("W");
      } else if (se.supersetParent) {
        setNumbers.push("D");
      } else {
        setNumbers.push(++curSet);
      }
    }
    return setNumbers;
  });

  const saveRow = async (recordID: string, field: string, newVal: any) => {
    try {
      await updateRecord("routineExercises", recordID, field, newVal);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteRows = async (indices: number[]) => {
    const newRows = props.routineExercises.filter((_, ind) => !indices.includes(ind));

    try {
      const delPromises = indices.map((index) =>
        pb.collection("routineExercises").delete(props.routineExercises[index].id)
      );
      await Promise.all(delPromises);
      await updateRecord(
        "routines",
        props.routineId,
        "exercisesOrder",
        newRows.map((r) => r.id)
      );

      props.setRoutine("routine", "expand", "routineExercises_via_routine", newRows);
    } catch (e) {
      console.error(e);
    }
  };

  const reorderRows = (draggedItemsOldInd: number, draggedItemsNewInd: number, count: number) => {
    // shuffle array
    const newRows = [...props.routineExercises];
    const draggedItems = newRows.splice(draggedItemsOldInd, count);

    const adjustedNewIndex =
      draggedItemsNewInd > draggedItemsOldInd ? draggedItemsNewInd - count : draggedItemsNewInd;
    newRows.splice(adjustedNewIndex, 0, ...draggedItems);

    props.setRoutine("routine", "expand", "routineExercises_via_routine", newRows);

    // send the updated list to 'exercisesOrder'
    updateRecord(
      "routines",
      props.routineId,
      "exercisesOrder",
      newRows.map((r) => r.id)
    ).catch(console.error);
  };

  const insertRowsAndSync = async (index: number, records: RoutineExercisesRecordExpand[]) => {
    const newRows = [...props.routineExercises];
    newRows.splice(index, 0, ...records);

    props.setRoutine("routine", "expand", "routineExercises_via_routine", newRows);

    await updateRecord(
      "routines",
      props.routineId,
      "exercisesOrder",
      newRows.map((r) => r.id)
    );
  };

  const addRoutineExercise = async (exercise: ExercisesRecordExpand) => {
    const data: RoutineExerciseCreateData = {
      routine: props.routineId,
      exercise: exercise.id,
    };
    const record = await pb.collection<RoutineExercisesRecordExpand>("routineExercises").create(data, {
      expand: SESSION_EXERCISE_EXPAND,
    });

    await insertRowsAndSync(props.routineExercises.length + 1, [record]);
    setShowCreateRoutineExercise(false);
  };

  const addDropset = async (index: number) => {
    const data = getDropsetAddData(props.routineExercises[index]);

    const record = await pb.collection<RoutineExercisesRecordExpand>("routineExercises").create(data, {
      expand: SESSION_EXERCISE_EXPAND,
    });

    await insertRowsAndSync(index + 1, [record]);
    setShowCreateRoutineExercise(false);
  };

  const duplicateRow = async (index: number) => {
    try {
      const newRoutine = await pb.send<RoutinesRecordExpand>(`/routine/duplicateRow`, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: {
          exerciseRowId: props.routineExercises[index].id,
          rowIndex: index,
        },
      });
      props.setRoutine({ routine: routineToSortedExercises(newRoutine) });
    } catch (e) {
      console.error(e);
    }

    setShowMoreExercise(false);
  };

  const importFromRoutine = async (routine: RoutinesRecordExpand, index: number) => {
    try {
      const newRoutine = await pb.send<RoutinesRecordExpand>(`/routine/importRoutine`, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: {
          importRoutineId: routine.id,
          sessionOrRoutineId: props.routineId,
          insertIndex: index,
        },
      });
      props.setRoutine({ routine: routineToSortedExercises(newRoutine) });
    } catch (e) {
      console.error(e);
    }

    setShowAddRoutine(false);
  };

  const columns = createMemo<ColumnDef<RoutineExercisesRecordExpand>[]>(() => [
    {
      header: "Set Type",
      cell: (ctx) => <p>{setNumbers()[ctx.row.index]}</p>,
    },
    {
      accessorKey: "exerciseDuration",
      cell: (ctx) => {
        return ctx.row.original.expand?.exercise?.isTimeBased ? (
          <DataTime
            value={ctx.getValue() as number}
            onValueChange={(v: number) =>
              props.setRoutine(
                "routine",
                "expand",
                "routineExercises_via_routine",
                ctx.row.index,
                "exerciseDuration",
                v
              )
            }
            saveFunc={(v) => saveRow(ctx.row.original.id, "exerciseDuration", v)}
          />
        ) : (
          <></>
        );
      },
    },
    {
      accessorFn: (row) =>
        row.expand?.exercise?.expand?.defaultMeasurementType?.numeric
          ? "measurementNumeric"
          : "measurementValue",
      id: "measurement",
      cell: (ctx) => {
        const mType = ctx.row.original.expand?.exercise?.expand?.defaultMeasurementType;
        const key = mType?.numeric ? "measurementNumeric" : "measurementValue";
        const path = mType?.numeric ? [key as any] : ["expand", key as any];

        return mType ? (
          <MultiMeasurementValueSelect
            value={ctx.row.original.expand?.measurementValue ?? null}
            values={
              ctx.row.original.expand?.exercise?.expand?.defaultMeasurementType?.expand
                ?.measurementValues_via_measurementType ?? []
            }
            valueNumeric={ctx.row.original.measurementNumeric || 0}
            key={key}
            numeric={mType.numeric ?? false}
            measurementType={mType.id}
            onValueChange={(v) =>
              props.setRoutine(
                "routine",
                "expand",
                "routineExercises_via_routine",
                ctx.row.index,
                //@ts-ignore
                ...path,
                v ?? undefined
              )
            }
            saveFunc={(v) => saveRow(ctx.row.original.id, key, v)}
          />
        ) : (
          <></>
        );
      },
    },
    {
      accessorFn: (row) =>
        row.expand?.exercise?.expand?.defaultMeasurementType2?.numeric
          ? "measurement2Numeric"
          : "measurement2Value",
      id: "measurement2",
      cell: (ctx) => {
        const mType = ctx.row.original.expand?.exercise?.expand?.defaultMeasurementType2;
        const key = mType?.numeric ? "measurement2Numeric" : "measurement2Value";
        const path = mType?.numeric ? [key as any] : ["expand", key as any];

        return mType ? (
          <MultiMeasurementValueSelect
            value={ctx.row.original.expand?.measurement2Value ?? null}
            values={
              ctx.row.original.expand?.exercise?.expand?.defaultMeasurementType2?.expand
                ?.measurementValues_via_measurementType ?? []
            }
            valueNumeric={ctx.row.original.measurement2Numeric || 0}
            key={key}
            numeric={mType.numeric ?? false}
            measurementType={mType.id}
            onValueChange={(v) =>
              props.setRoutine(
                "routine",
                "expand",
                "routineExercises_via_routine",
                ctx.row.index,
                //@ts-ignore
                ...path,
                v ?? undefined
              )
            }
            saveFunc={(v) => {
              return saveRow(ctx.row.original.id, key, v);
            }}
          />
        ) : (
          <></>
        );
      },
    },
    {
      accessorKey: "addedWeight",
      cell: (ctx) => (
        <NumberInput
          rawValue={ctx.getValue() as number}
          onRawValueChange={(v) =>
            props.setRoutine(
              "routine",
              "expand",
              "routineExercises_via_routine",
              ctx.row.index,
              "addedWeight",
              v as number
            )
          }
          saveFunc={(v) => saveRow(ctx.row.original.id, "addedWeight", v)}
        />
      ),
    },
    {
      id: "more",
      cell: (ctx) => (
        <IconButton
          onClick={() => {
            setShowMoreExercise(true);
            setSelectedExerciseInd(ctx.row.index);
          }}
        >
          <Ellipsis />
        </IconButton>
      ),
    },
  ]);

  const table = createSolidTable({
    get data() {
      return props.routineExercises;
    },
    columns: columns(),
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id, // required because row indexes will change
  });

  createDisposableEffect(
    () => props.routineExercises.length > 0,
    () =>
      monitorForElements({
        canMonitor({ source }) {
          return source.data.isExerciseRow as boolean;
        },
        onDrop({ location, source }) {
          const target = location.current.dropTargets[0];
          if (!target) {
            return;
          }

          const sourceData = source.data;
          const targetData = target.data;

          if (!sourceData.isExerciseRow || !targetData.isExerciseRow) {
            return;
          }

          if ((sourceData.ind as number) < 0 || (targetData.ind as number) < 0) {
            return;
          }

          const closestEdgeOfTarget = extractClosestEdge(targetData);

          const newInd =
            closestEdgeOfTarget === "top" ? (targetData.ind as number) : (targetData.ind as number) + 1;

          let inds = [];
          if (sourceData.isGroup as boolean) {
            inds = getGroupInds(sourceData.ind as number, groups());
          } else {
            inds = getSupersetInds(sourceData.ind as number, props.routineExercises);
          }

          reorderRows(sourceData.ind as number, newInd, inds.length);
        },
      })
  );

  return (
    <div class="flex flex-col items-center">
      <div class="w-full">
        <For each={table.getRowModel().rows}>
          {(row) => {
            const firstOfGroup = row.index === 0 || groups()[row.index] !== groups()[row.index - 1];

            return (
              <DraggableRow
                row={row}
                saveRow={saveRow}
                groupTitle={groups()[row.index]}
                firstOfExercises={
                  firstOfGroup ||
                  row.index === 0 ||
                  row.original.exercise !== props.routineExercises[row.index - 1].exercise
                }
                firstOfGroup={firstOfGroup}
                lastOfGroup={
                  row.index === props.routineExercises.length - 1 ||
                  groups()[row.index] !== groups()[row.index + 1]
                }
                firstOfSuperset={!row.original.supersetParent}
                lastOfSuperset={
                  row.index === props.routineExercises.length - 1 ||
                  !props.routineExercises[row.index + 1].supersetParent
                }
                getGroupInds={() => getGroupInds(row.index, groups())}
                timeInput={
                  <DataTime
                    value={row.original.restAfter || 0}
                    onValueChange={(v) =>
                      props.setRoutine(
                        "routine",
                        "expand",
                        "routineExercises_via_routine",
                        row.index,
                        "restAfter",
                        v
                      )
                    }
                    saveFunc={(v: number) => saveRow(row.original.id, "restAfter", v)}
                  />
                }
                lastRow={row.index === props.routineExercises.length - 1}
              />
            );
          }}
        </For>
      </div>
      <Button
        variantColor="good"
        onClick={() => setShowCreateRoutineExercise(true)}
        class="mt-2 flex items-center pl-1 pr-2"
      >
        <Plus size={20} /> Set
      </Button>
      <Button
        variantColor="good"
        onClick={() => setShowAddRoutine(true)}
        class="mt-2 flex items-center pl-1 pr-2"
      >
        <Plus size={20} /> Routine
      </Button>
      <Show when={showCreateRoutineExercise()}>
        <ExerciseSelectModal
          setModalVisible={setShowCreateRoutineExercise}
          selectExercise={addRoutineExercise}
        />
      </Show>
      <Show when={showAddRoutine()}>
        <RoutineSelectModal
          setModalVisible={setShowAddRoutine}
          addRoutine={(r) => importFromRoutine(r, props.routineExercises.length)}
        />
      </Show>
      <Show
        when={
          showMoreExercise() &&
          selectedExerciseInd() >= 0 &&
          selectedExerciseInd() < props.routineExercises.length
        }
      >
        <RoutineExerciseMoreModal
          routineId={props.routineId}
          setRoutine={props.setRoutine}
          setModalVisible={setShowMoreExercise}
          initialExercise={props.routineExercises[selectedExerciseInd()]}
          deleteRow={async () =>
            await deleteRows(getSupersetInds(selectedExerciseInd(), props.routineExercises))
          }
          duplicateRow={async () => await duplicateRow(selectedExerciseInd())}
          addDropSet={async () => await addDropset(selectedExerciseInd())}
        />
      </Show>
    </div>
  );
};

export default RoutineExerciseList;
