import { Component, createMemo, createSignal, onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { ColumnDef } from "@tanstack/solid-table";

import { useAuthPB } from "../../config/pocketbase";
import List from "../app/List";

export const SessionList: Component = () => {
  const [sessions, setSessions] = createSignal<SessionsRecordExpand[]>([]);
  const [loading, setLoading] = createSignal(false);
  const navigate = useNavigate();
  const { pb } = useAuthPB();

  const columns = createMemo<ColumnDef<SessionsRecordExpand>[]>(() => [
    {
      accessorKey: "name",
      header: "Session Name",
      cell: (ctx) => <div class="pl-1">{(ctx.getValue() as HTMLElement) || "-"}</div>,
    },
    {
      accessorKey: "userDay",
      header: "Date",
      cell: (ctx) => (
        <div class="text-right pr-1">{new Date(ctx.getValue<string>()).toLocaleDateString()}</div>
      ),
    },
  ]);

  const getData = async () => {
    setLoading(true);
    try {
      const sessions = await pb
        .collection<SessionsRecordExpand>("sessions")
        .getFullList({ sort: "-userDay", fields: "name, notes, userDay" });

      setSessions(sessions);
    } catch (e) {
      console.error("get sessions error: ", e);
    } finally {
      setLoading(false);
    }
  };

  onMount(() => {
    getData();
  });

  return (
    <List<SessionsRecordExpand>
      columns={columns}
      data={sessions}
      onRowClick={(rec) => navigate(`/log?date=${rec.userDay}`)}
      loading={loading()}
      headers
    />
  );
};
