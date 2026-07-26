import Link from "next/link";
import { TASK_PRIORITY_BADGE, TASK_PRIORITY_DOT } from "@/lib/constants";
import { formatDateLong, WEEKDAY_LABELS, type CalendarGridDay } from "@/lib/date";
import type { TaskWithContext } from "@/lib/types";

// sm+ ekranda hücre başına gösterilecek pill sayısı; mobilde nokta sayısı.
const MAX_PILLS = 3;
const MAX_DOTS = 6;

function cellToneClass(inMonth: boolean, isSelected: boolean): string {
  if (isSelected) {
    return "border-brand-400 bg-brand-50/70 ring-1 ring-inset ring-brand-400 dark:border-brand-700 dark:bg-brand-950/30 dark:ring-brand-700";
  }
  if (!inMonth) {
    return "border-black/5 bg-zinc-50/70 dark:border-white/5 dark:bg-white/[0.03]";
  }
  return "border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900";
}

function dateNumberClass(isToday: boolean, inMonth: boolean): string {
  if (isToday) return "bg-brand-600 text-white";
  if (inMonth) {
    return "text-zinc-900 hover:text-brand-600 dark:text-zinc-100 dark:hover:text-brand-400";
  }
  // Dolgu günleri: iki temada da ≥4.5:1 kalan soluk-metin çifti (bkz. CLAUDE.md
  // "Tasarım kuralları") — ayın dışında olduğunu gösterir ama okunaksız olmaz.
  return "text-zinc-500 hover:text-brand-600 dark:text-zinc-400 dark:hover:text-brand-400";
}

// Ay ızgarasının 7 sütunlu grid'i: haftanın günleri başlığı + her gün için bir
// hücre. Hücrenin TAMAMI yerine yalnızca tarih numarası tıklanabilir (gün
// detayına gider); her pill ayrıca kendi görevine linkli — ikisini iç içe
// <a> yapmadan (geçersiz HTML) ayrı kardeş linkler olarak kurmanın yolu bu.
export default function CalendarGrid({
  gridDays,
  tasksByDate,
  today,
  monthParam,
  selectedDay,
}: {
  gridDays: CalendarGridDay[];
  tasksByDate: Map<string, TaskWithContext[]>;
  today: string;
  monthParam: string;
  selectedDay: string | null;
}) {
  return (
    <div className="grid grid-cols-7 gap-1 sm:gap-2">
      {WEEKDAY_LABELS.map((label, i) => (
        <div
          key={`${label}-${i}`}
          className="px-1 pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
        >
          {label}
        </div>
      ))}

      {gridDays.map((day) => {
        const dayTasks = tasksByDate.get(day.date) ?? [];
        const isToday = day.date === today;
        const isSelected = day.date === selectedDay;
        const dayHref = `/calendar?month=${monthParam}&day=${day.date}`;
        const dayNumber = Number(day.date.slice(-2));
        const dayLabel = formatDateLong(day.date);

        return (
          <div
            key={day.date}
            className={`flex min-h-16 min-w-0 flex-col gap-1 rounded-lg border p-1 transition-colors sm:min-h-28 sm:p-1.5 ${cellToneClass(day.inMonth, isSelected)}`}
          >
            <Link
              href={dayHref}
              aria-current={isToday ? "date" : undefined}
              aria-label={dayTasks.length > 0 ? `${dayLabel} — ${dayTasks.length} görev` : dayLabel}
              className={`touch-target inline-flex h-6 w-6 shrink-0 items-center justify-center self-start rounded-full text-xs font-semibold ${dateNumberClass(isToday, day.inMonth)}`}
            >
              {dayNumber}
            </Link>

            {/* sm+: öncelik renkli, başlığı okunabilir pill'ler */}
            <div className="hidden min-w-0 flex-col gap-0.5 sm:flex">
              {dayTasks.slice(0, MAX_PILLS).map((t) => (
                <Link
                  key={t.id}
                  href={`/tasks/${t.id}`}
                  title={t.title}
                  className={`truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight ${TASK_PRIORITY_BADGE[t.priority]}`}
                >
                  {t.title}
                </Link>
              ))}
              {dayTasks.length > MAX_PILLS && (
                <Link
                  href={dayHref}
                  className="truncate px-1 text-[10px] font-medium text-zinc-500 hover:text-brand-600 dark:text-zinc-400 dark:hover:text-brand-400"
                >
                  +{dayTasks.length - MAX_PILLS} daha
                </Link>
              )}
            </div>

            {/* Mobil: pill metni bir 7 sütunlu hücreye sığmıyor, yalnızca
                öncelik renginde noktalar — sayı/başlık için tarihe dokun. */}
            {dayTasks.length > 0 && (
              <div className="flex flex-wrap gap-0.5 sm:hidden" aria-hidden>
                {dayTasks.slice(0, MAX_DOTS).map((t) => (
                  <span key={t.id} className={`h-1.5 w-1.5 rounded-full ${TASK_PRIORITY_DOT[t.priority]}`} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
