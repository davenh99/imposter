import { Component, createMemo } from "solid-js";
import { ColumnDef } from "@tanstack/solid-table";
import ArrowRight from "lucide-solid/icons/arrow-right";

import List from "../app/List";
import { MuscleGroups } from "../../../Types";

interface Props {
  onClick: (muscleGroup: { name: string }) => void;
}

export const MuscleGroupList: Component<Props> = (props) => {
  const data = createMemo(() => MuscleGroups.map((mg) => ({ name: mg })));

  const columns = createMemo<ColumnDef<{ name: string }>[]>(() => [
    {
      accessorKey: "name",
      header: "MuscleGroup",
      cell: (ctx) => (
        <div class="flex justify-between">
          <div class="flex-1 truncate">{ctx.getValue() as Element}</div>
          <ArrowRight class="self-end" />
        </div>
      ),
    },
  ]);

  return <List<{ name: string }> columns={columns} onRowClick={props.onClick} data={data} search />;
};

export default MuscleGroupList;
