import { Component, createMemo, createSignal, For, onMount, Show } from "solid-js";
import ArrowRight from "lucide-solid/icons/arrow-right";
import Plus from "lucide-solid/icons/plus";
import {
  ColumnDef,
  createSolidTable,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
} from "@tanstack/solid-table";
import { ClientResponseError } from "pocketbase";

import { Button, Input } from "../../components";
import { useAuthPB } from "../../config/pocketbase";

interface Props {
  createRoutine: () => Promise<void>;
  onClick: (routine: RoutinesRecord) => void;
}

export const RoutineList: Component<Props> = (props) => {
  const [routines, setRoutines] = createSignal<RoutinesRecord[]>([]);
  const [nameFilter, setNameFilter] = createSignal<string>("");
  const { pb } = useAuthPB();

  const columns = createMemo<ColumnDef<RoutinesRecord>[]>(() => [
    {
      accessorKey: "name",
      header: "Routine",
      cell: (ctx) => (
        <div>
          <p class="font-bold">{ctx.getValue() as string}</p>
          <p class="text-sm text-ellipsis whitespace-nowrap overflow-hidden">
            {ctx.row.original.description}
          </p>
          <p class="text-xs space-y-0">
            <For each={ctx.row.original.preview.split(", ")}>
              {(val) => <span class="block text-ellipsis whitespace-nowrap overflow-hidden">{val}</span>}
            </For>
          </p>
        </div>
      ),
    },
    {
      header: "",
      id: "continue",
      cell: () => <ArrowRight />,
    },
  ]);

  const table = createSolidTable({
    get data() {
      return routines();
    },
    columns: columns(),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      get columnFilters() {
        return nameFilter() ? [{ id: "name", value: nameFilter() }] : [];
      },
    },
  });

  const getData = async () => {
    try {
      const routines = await pb.collection<RoutinesRecord>("routines").getFullList({ sort: "name" });

      setRoutines(routines);
    } catch (e) {
      if (e instanceof ClientResponseError && e.isAbort) {
      } else {
        console.error("get exercises error: ", e);
      }
    }
  };

  onMount(() => {
    getData();
  });

  return (
    <>
      <div class="w-full flex justify-start items-center space-x-2 sticky top-0 bg-charcoal-500/90 pt-3 pb-2 backdrop-blur-xs">
        <Button
          class="flex text-sm items-center pl-1 pr-2"
          variant="solid"
          variantColor="good"
          onClick={() => props.createRoutine()}
        >
          <Plus size={20} />
          New
        </Button>
        <Input
          value={nameFilter()}
          onChange={setNameFilter}
          class="flex-1"
          inputProps={{ placeholder: "Search Routines", class: "p-1 w-full" }}
        />
      </div>
      <div class="mt-2">
        <div class="space-y-2">
          <For each={table.getRowModel().rows}>
            {(row) => (
              <div
                class="rounded-md bg-charcoal-600 flex justify-between"
                onClick={() => props.onClick(row.original)}
              >
                <For each={row.getVisibleCells()}>
                  {(cell) => {
                    const classes =
                      cell.column.getIndex() === 0
                        ? "p-1 flex flex-col flex-1 min-w-0"
                        : "p-1 flex items-center w-8 justify-center";

                    return (
                      <div class={classes}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>
                    );
                  }}
                </For>
              </div>
            )}
          </For>
        </div>
        <Show when={table.getRowModel().rows.length === 0}>
          <div class="text-center">No Routines found.</div>
        </Show>
      </div>
    </>
  );
};

export default RoutineList;
