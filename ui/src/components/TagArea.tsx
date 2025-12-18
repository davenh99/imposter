import { Component, createSignal, For, JSX, Show } from "solid-js";

import Input from "./Input";
import { useAuthPB } from "../config/pocketbase";
import { ClientResponseError } from "pocketbase";
import Tag from "./Tag";

interface TagAreaProps {
  tags: TagsRecord[];
  setTags: (tags: TagsRecord[]) => void;
  modelName: string;
  recordID: string;
  updateRecord?: (modelName: string, recordID: string, field: string, newVal: any) => Promise<any>;
}

export const TagArea: Component<TagAreaProps> = (props) => {
  const [tagInput, setTagInput] = createSignal("");
  const { pb, user, updateRecord } = useAuthPB();
  const updateFn = props.updateRecord ?? updateRecord;

  const handleTagInput: JSX.EventHandlerUnion<HTMLInputElement, KeyboardEvent> = async (e) => {
    if (e.key === "Enter" && e.currentTarget.value.trim()) {
      e.preventDefault();
      const newTag = e.currentTarget.value.trim();

      if (!props.tags.map((t) => t.name).includes(newTag)) {
        try {
          const foundTag = await pb
            .collection<TagsRecord>("tags")
            .getFirstListItem(`createdBy = '${user.id}' && name = '${newTag}'`);

          await updateFn(props.modelName, props.recordID, "+tags", foundTag.id);
          props.setTags([...props.tags, foundTag]);
        } catch (e) {
          if (e instanceof ClientResponseError && e.status == 404) {
            const createdTag = await pb
              .collection<TagsRecord>("tags")
              .create({ name: newTag, public: false, createdBy: user.id, colorHex: "#ccccff" });

            await updateFn(props.modelName, props.recordID, "+tags", createdTag.id);
            props.setTags([...props.tags, createdTag]);
          } else {
            console.error(e);
          }
        }
      }
      setTagInput("");
    }
  };

  const deleteTag = async (t: TagsRecord) => {
    try {
      await updateFn(props.modelName, props.recordID, "tags-", t.id);
      props.setTags((props.tags || []).filter((tag) => tag.id !== t.id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div class="rounded-md p-2 flex flex-col bg-charcoal-600">
      <div class="flex flex-wrap gap-2">
        <For each={props.tags || []}>
          {(t) => <Tag title={t.name || ""} colorHex={t.colorHex || ""} onClick={() => deleteTag(t)} />}
        </For>
        <Input
          label=""
          noPadding
          value={tagInput()}
          onChange={(v) => setTagInput(v)}
          inputProps={{
            onKeyDown: handleTagInput,
            placeholder: "Add tags (press Enter)",
          }}
          class="flex-1 min-w-[120px]"
        />
      </div>
    </div>
  );
};

export default TagArea;
