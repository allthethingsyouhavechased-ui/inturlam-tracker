"use client";

import { useRef } from "react";
import { addCommentAction } from "@/lib/actions/comments";
import SubmitButton from "./SubmitButton";

export default function CommentForm({ taskId }: { taskId: string }) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={ref}
      action={async (fd) => {
        await addCommentAction(fd);
        ref.current?.reset();
      }}
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="taskId" value={taskId} />
      <textarea
        name="body"
        required
        rows={2}
        placeholder="Bir not ekle…"
        className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-zinc-900"
      />
      <div className="flex justify-end">
        <SubmitButton>Yorum ekle</SubmitButton>
      </div>
    </form>
  );
}
