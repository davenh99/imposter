import { Component, For, createSignal } from "solid-js";
import {
  attachClosestEdge,
  extractClosestEdge,
  type Edge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import invariant from "tiny-invariant";
import { flexRender, type Row } from "@tanstack/solid-table";

import { DraggingState } from "../../../Types";
import { SetStoreFunction } from "solid-js/store";
import { DROP_ABOVE_CLASS, DROP_BELOW_CLASS } from "../../../constants";
import { createDisposableEffect } from "../../methods/disposable";

interface DraggableRowProps {
  row: Row<SessionMealsRecordExpand>;
  saveRow: (recordID: string, field: string, newVal: any) => Promise<void>;
  setSession: SetStoreFunction<{
    session: SessionsRecordExpand | null;
  }>;
}

export const DraggableRow: Component<DraggableRowProps> = (props) => {
  let ref: HTMLDivElement | undefined = undefined;
  const [dragging, setDragging] = createSignal<DraggingState>("idle");
  const [closestEdge, setClosestEdge] = createSignal<Edge | null>();

  createDisposableEffect(
    () => !!props.row?.original,
    () => {
      const element = ref;
      invariant(element);

      dropTargetForElements({
        element,
        canDrop({ source }) {
          // not allowing dropping on yourself
          if (source.element === element) {
            return false;
          }
          // don't allow dropping group on it's own rows
          if (source.data.isGroup && (source.data.groupInds as number[]).includes(props.row.index)) {
            return false;
          }
          // only allowing meals to be dropped on me
          return source.data.isMealRow as boolean;
        },
        getIsSticky() {
          return true;
        },
        getData({ input }) {
          return attachClosestEdge(
            { id: props.row.original.id, ind: props.row.index, isMealRow: true },
            { element, input, allowedEdges: ["top", "bottom"] }
          );
        },
        onDragEnter({ self }) {
          const _closestEdge = extractClosestEdge(self.data);
          setDragging("dragging-over");
          setClosestEdge(_closestEdge);
        },
        onDrag({ self }) {
          const _closestEdge = extractClosestEdge(self.data);
          // Only need to update state if nothing has changed.
          // Prevents re-rendering.
          if (dragging() !== "dragging-over" || _closestEdge !== closestEdge()) {
            setDragging("dragging-over");
            setClosestEdge(_closestEdge);
          }
        },
        onDragLeave() {
          setDragging("idle");
        },
        onDrop() {
          setDragging("idle");
        },
      });
    }
  );

  createDisposableEffect(
    () => !!props.row?.original,
    () => {
      const element = ref;
      invariant(element);

      draggable({
        element,
        getInitialData() {
          return {
            id: props.row.original.id,
            ind: props.row.index,
            isMealRow: true,
          };
        },
        onGenerateDragPreview({ nativeSetDragImage }) {
          setCustomNativeDragPreview({
            getOffset: pointerOutsideOfPreview({
              x: "16px",
              y: "8px",
            }),
            render({ container }) {
              const preview = document.createElement("div");
              preview.textContent = props.row.original.name || "";
              preview.className = "px-2.5 py-1.5 rounded-sm bg-charcoal-800";
              container.appendChild(preview);
            },
            nativeSetDragImage,
          });
        },
        onDragStart() {
          setDragging("dragging");
        },
        onDrop() {
          setDragging("idle");
        },
      });
    }
  );

  return (
    <div
      ref={ref}
      class={`flex flex-col cursor-grab active:cursor-grabbing ${
        dragging() === "dragging" ? "opacity-40" : ""
      } rounded-md
        ${dragging() === "dragging-over" && closestEdge() === "top" ? DROP_ABOVE_CLASS : ""}
        ${dragging() === "dragging-over" && closestEdge() === "bottom" ? DROP_BELOW_CLASS : ""}`}
    >
      <div class="flex w-full">
        <For each={props.row.getVisibleCells()}>
          {(cell) => {
            let classes = `px-2 ${
              cell.column.id === "name" ? "flex-6" : cell.column.id === "more" ? "flex-1" : "flex-2"
            }`;

            return <div class={classes}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>;
          }}
        </For>
      </div>
    </div>
  );
};
