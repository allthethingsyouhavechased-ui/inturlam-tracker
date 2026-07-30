import type { ReactNode } from "react";

export default function EmptyState({
  title,
  description,
  action,
  compact = false,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 bg-zinc-50/70 px-6 text-center dark:border-white/15 dark:bg-white/[0.025] ${
        compact ? "min-h-32 py-5" : "min-h-52 py-8"
      }`}
    >
      <span
        className="grid size-10 place-items-center rounded-xl bg-black/5 text-zinc-500 dark:bg-white/10 dark:text-zinc-300"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" fill="none" className="size-5" stroke="currentColor">
          <path
            d="M8 6h8M8 10h8M8 14h5M5 3h14a1 1 0 0 1 1 1v16l-4-2-4 2-4-2-4 2V4a1 1 0 0 1 1-1Z"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <h3 className="mt-3 text-sm font-semibold text-zinc-800 dark:text-zinc-100">{title}</h3>
      <p className="mt-1 max-w-md text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
