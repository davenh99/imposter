import { Component, createMemo, createSignal, onMount } from "solid-js";
import { ColumnDef } from "@tanstack/solid-table";
import ArrowRight from "lucide-solid/icons/arrow-right";

import List from "../app/List";
import { useAuthPB } from "../../config/pocketbase";

interface Props {
  onClick: (measurementType: MeasurementTypesExpand) => void;
}

export const MeasurementTypeList: Component<Props> = (props) => {
  const [data, setData] = createSignal<MeasurementTypesExpand[]>([]);
  const [loading, setLoading] = createSignal(true);
  const { pb } = useAuthPB();

  const columns = createMemo<ColumnDef<MeasurementTypesExpand>[]>(() => [
    {
      accessorKey: "name",
      header: "Measurement Type",
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
      const measurementTypes = await pb.collection<MeasurementTypesExpand>("measurementTypes").getFullList({
        sort: "name",
      });

      setData(measurementTypes);
    } catch (e) {
      console.error("get measurementTypes error: ", e);
    } finally {
      setLoading(false);
    }
  };

  onMount(() => {
    getData();
  });

  return (
    <List<MeasurementTypesExpand>
      columns={columns}
      onRowClick={props.onClick}
      data={data}
      loading={loading()}
      search
    />
  );
};
