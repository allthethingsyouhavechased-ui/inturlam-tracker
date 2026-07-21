"use client";

import { useTransition } from "react";
import { setContentStatusAction } from "@/lib/actions/content";
import {
  CONTENT_STATUS_BADGE,
  CONTENT_STATUS_LABEL,
  CONTENT_STATUSES,
} from "@/lib/constants";
import type { ContentStatus } from "@/lib/types";

export default function ContentStatusSelect({
  contentId,
  status,
}: {
  contentId: string;
  status: ContentStatus;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      aria-label="İçerik durumu"
      value={status}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as ContentStatus;
        startTransition(() => setContentStatusAction(contentId, next));
      }}
      className={`cursor-pointer rounded-full border-0 px-2.5 py-1 text-xs font-medium outline-none ${CONTENT_STATUS_BADGE[status]} ${pending ? "opacity-50" : ""}`}
    >
      {CONTENT_STATUSES.map((s) => (
        <option key={s} value={s}>
          {CONTENT_STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}
