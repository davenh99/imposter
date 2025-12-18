import { Component, createMemo, createSignal, onMount } from "solid-js";
import { ColumnDef } from "@tanstack/solid-table";
import ArrowRight from "lucide-solid/icons/arrow-right";

import List from "../app/List";
import { useAuthPB } from "../../config/pocketbase";

interface Props {
  onClick: (equipment: EquipmentsRecord) => void;
}

export const EquipmentList: Component<Props> = (props) => {
  const [data, setData] = createSignal<EquipmentsRecord[]>([]);
  const [loading, setLoading] = createSignal(true);
  const { pb } = useAuthPB();

  const columns = createMemo<ColumnDef<EquipmentsRecord>[]>(() => [
    {
      accessorKey: "name",
      header: "Equipment",
      cell: (ctx) => (
        <div class="flex justify-between">
          <div class="flex-1 truncate">{ctx.getValue() as Element}</div>
          <ArrowRight class="self-end" />
        </div>
      ),
    },
  ]);

  const getData = async () => {
    try {
      const equipments = await pb.collection<EquipmentsRecord>("equipments").getFullList({
        sort: "name",
      });

      setData(equipments);
    } catch (e) {
      console.error("get equipments error: ", e);
    } finally {
      setLoading(false);
    }
  };

  onMount(() => {
    getData();
  });

  return (
    <List<EquipmentsRecord>
      columns={columns}
      onRowClick={props.onClick}
      data={data}
      loading={loading()}
      search
    />
  );
};
