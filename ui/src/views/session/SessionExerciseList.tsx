import { Component, createMemo, createSignal, For, Show } from "solid-js";
import { SetStoreFunction } from "solid-js/store";
import { ColumnDef, createSolidTable, getCoreRowModel } from "@tanstack/solid-table";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import Ellipsis from "lucide-solid/icons/ellipsis-vertical";
import Plus from "lucide-solid/icons/plus";

import { useAuthPB } from "../../config/pocketbase";
import { SessionExerciseCreateData } from "../../../Types";
import {
  Button,
  IconButton,
  DataTime,
  NumberInput,
  RPESelect,
  MultiMeasurementValueSelect,
} from "../../components";
import { DraggableRow } from "../exercises/SessionOrRoutineExerciseDraggableRow";
import { getDropsetAddData, getGroupInds, getGroups, getSupersetInds } from "../../methods/sessionExercise";
import ExerciseSelectModal from "../exercises/ExerciseSelectModal";
import { SESSION_EXERCISE_EXPAND } from "../../../constants";
import SessionExerciseMoreModal from "./SessionExerciseMoreModal";
import RoutineSelectModal from "../routines/RoutineSelectModal";
import { createDisposableEffect } from "../../methods/disposable";

interface Props {
  sessionExercises: SessionExercisesRecordExpand[];
  sessionID: string;
  setSession: SetStoreFunction<{
    session: SessionsRecordExpand | null;
  }>;
}

export const SessionExerciseList: Component<Props> = (props) => {
  const [showCreateSessionExercise, setShowCreateSessionExercise] = createSignal(false);
  const [showAddRoutine, setShowAddRoutine] = createSignal(false);
  const [showMoreExercise, setShowMoreExercise] = createSignal(false);
  const [selectedExerciseInd, setSelectedExerciseInd] = createSignal(-1);
  const { pb, user, updateRecord, sessionToSortedExercisesAndMeals } = useAuthPB();
  const groups = createMemo(() => getGroups(props.sessionExercises));

  const setNumbers = createMemo(() => {
    const setNumbers = [];
    let curSet = 0;

    for (const se of props.sessionExercises) {
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
      await updateRecord("sessionExercises", recordID, field, newVal);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteRows = async (indices: number[]) => {
    const newRows = props.sessionExercises.filter((_, ind) => !indices.includes(ind));

    try {
      const delPromises = indices.map((index) =>
        pb.collection("sessionExercises").delete(props.sessionExercises[index].id)
      );
      await Promise.all(delPromises);
      await updateRecord(
        "sessions",
        props.sessionID,
        "exercisesOrder",
        newRows.map((r) => r.id)
      );

      props.setSession("session", "expand", "sessionExercises_via_session", newRows);
    } catch (e) {
      console.error(e);
    }
  };

  const reorderRows = (draggedItemsOldInd: number, draggedItemsNewInd: number, count: number) => {
    // shuffle array
    const newRows = [...props.sessionExercises];
    const draggedItems = newRows.splice(draggedItemsOldInd, count);

    const adjustedNewIndex =
      draggedItemsNewInd > draggedItemsOldInd ? draggedItemsNewInd - count : draggedItemsNewInd;
    newRows.splice(adjustedNewIndex, 0, ...draggedItems);

    props.setSession("session", "expand", "sessionExercises_via_session", newRows);

    // send the updated list to 'exercisesOrder'
    updateRecord(
      "sessions",
      props.sessionID,
      "exercisesOrder",
      newRows.map((r) => r.id)
    ).catch(console.error);
  };

  const insertRowsAndSync = async (index: number, records: SessionExercisesRecordExpand[]) => {
    const newRows = [...props.sessionExercises];
    newRows.splice(index, 0, ...records);

    props.setSession("session", "expand", "sessionExercises_via_session", newRows);

    await updateRecord(
      "sessions",
      props.sessionID,
      "exercisesOrder",
      newRows.map((r) => r.id)
    );
  };

  const addSessionExercise = async (exercise: ExercisesRecord) => {
    const data: SessionExerciseCreateData = {
      user: user.id,
      session: props.sessionID,
      exercise: exercise.id,
      perceivedEffort: 0,
    };

    const record = await pb.collection<SessionExercisesRecordExpand>("sessionExercises").create(data, {
      expand: SESSION_EXERCISE_EXPAND,
    });

    await insertRowsAndSync(props.sessionExercises.length + 1, [record]);
    setShowCreateSessionExercise(false);
  };

  const addDropset = async (index: number) => {
    const data = getDropsetAddData(props.sessionExercises[index]);

    const record = await pb.collection<SessionExercisesRecordExpand>("sessionExercises").create(data, {
      expand: SESSION_EXERCISE_EXPAND,
    });

    await insertRowsAndSync(index + 1, [record]);
    setShowCreateSessionExercise(false);
  };

  const duplicateRow = async (index: number) => {
    try {
      const newSession = await pb.send<SessionsRecordExpand>(`/session/duplicateRow`, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: {
          exerciseRowId: props.sessionExercises[index].id,
          rowIndex: index,
        },
      });
      props.setSession({ session: sessionToSortedExercisesAndMeals(newSession) });
    } catch (e) {
      console.error(e);
    }

    setShowMoreExercise(false);
  };

  const importFromRoutine = async (routine: RoutinesRecordExpand, index: number) => {
    try {
      const newSession = await pb.send<SessionsRecordExpand>(`/session/importRoutine`, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: {
          importRoutineId: routine.id,
          sessionOrRoutineId: props.sessionID,
          insertIndex: index,
        },
      });
      props.setSession({ session: sessionToSortedExercisesAndMeals(newSession) });
    } catch (e) {
      console.error(e);
    }

    setShowAddRoutine(false);
  };

  const columns = createMemo<ColumnDef<SessionExercisesRecordExpand>[]>(() => [
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
              props.setSession(
                "session",
                "expand",
                "sessionExercises_via_session",
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
            key={key}
            values={
              ctx.row.original.expand?.exercise?.expand?.defaultMeasurementType?.expand
                ?.measurementValues_via_measurementType ?? []
            }
            value={ctx.row.original.expand?.measurementValue ?? null}
            valueNumeric={ctx.row.original.measurementNumeric || 0}
            numeric={mType.numeric ?? false}
            measurementType={mType.id}
            onValueChange={(v) =>
              props.setSession(
                "session",
                "expand",
                "sessionExercises_via_session",
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
              props.setSession(
                "session",
                "expand",
                "sessionExercises_via_session",
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
      accessorKey: "addedWeight",
      cell: (ctx) => (
        <NumberInput
          rawValue={ctx.getValue() as number}
          onRawValueChange={(v) =>
            props.setSession(
              "session",
              "expand",
              "sessionExercises_via_session",
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
      accessorKey: "perceivedEffort",
      cell: (ctx) => (
        <RPESelect
          value={ctx.row.original.perceivedEffort || 0}
          onChange={(v) => {
            props.setSession(
              "session",
              "expand",
              "sessionExercises_via_session",
              ctx.row.index,
              "perceivedEffort",
              v
            );
            saveRow(ctx.row.original.id, "perceivedEffort", v);
          }}
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
      return props.sessionExercises;
    },
    columns: columns(),
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id, // required because row indexes will change
  });

  createDisposableEffect(
    () => props.sessionExercises.length > 0,
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
            inds = getSupersetInds(sourceData.ind as number, props.sessionExercises);
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
                  row.original.exercise !== props.sessionExercises[row.index - 1].exercise
                }
                firstOfGroup={firstOfGroup}
                lastOfGroup={
                  row.index === props.sessionExercises.length - 1 ||
                  groups()[row.index] !== groups()[row.index + 1]
                }
                firstOfSuperset={!row.original.supersetParent}
                lastOfSuperset={
                  row.index === props.sessionExercises.length - 1 ||
                  !props.sessionExercises[row.index + 1].supersetParent
                }
                getGroupInds={() => getGroupInds(row.index, groups())}
                timeInput={
                  <DataTime
                    value={row.original.restAfter || 0}
                    onValueChange={(v) =>
                      props.setSession(
                        "session",
                        "expand",
                        "sessionExercises_via_session",
                        row.index,
                        "restAfter",
                        v
                      )
                    }
                    saveFunc={(v: number) => saveRow(row.original.id, "restAfter", v)}
                  />
                }
                lastRow={row.index === props.sessionExercises.length - 1}
              />
            );
          }}
        </For>
      </div>
      <Button
        variantColor="good"
        onClick={() => setShowCreateSessionExercise(true)}
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
      <Show when={showCreateSessionExercise()}>
        <ExerciseSelectModal
          setModalVisible={setShowCreateSessionExercise}
          selectExercise={addSessionExercise}
        />
      </Show>
      <Show when={showAddRoutine()}>
        <RoutineSelectModal
          setModalVisible={setShowAddRoutine}
          addRoutine={(r) => importFromRoutine(r, props.sessionExercises.length)}
        />
      </Show>
      <Show
        when={
          showMoreExercise() &&
          selectedExerciseInd() >= 0 &&
          selectedExerciseInd() < props.sessionExercises.length
        }
      >
        <SessionExerciseMoreModal
          sessionID={props.sessionID}
          setSession={props.setSession}
          setModalVisible={setShowMoreExercise}
          initialExercise={props.sessionExercises[selectedExerciseInd()]}
          deleteRow={async () =>
            await deleteRows(getSupersetInds(selectedExerciseInd(), props.sessionExercises))
          }
          duplicateRow={async () => await duplicateRow(selectedExerciseInd())}
          addDropSet={async () => await addDropset(selectedExerciseInd())}
        />
      </Show>
    </div>
  );
};
