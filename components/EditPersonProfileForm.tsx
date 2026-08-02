import PersonAvatarPicker from "@/components/PersonAvatarPicker";
import SubmitButton from "@/components/SubmitButton";
import { updatePersonProfileAction } from "@/lib/actions/people";
import type { Person } from "@/lib/types";

const inputClass =
  "min-h-11 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none placeholder:text-zinc-500 focus:border-brand-400 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-400";

export default function EditPersonProfileForm({ person }: { person: Person }) {
  return (
    <form
      action={updatePersonProfileAction}
      className="space-y-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-zinc-900 sm:p-6"
    >
      <input type="hidden" name="personId" value={person.id} />

      <PersonAvatarPicker name={person.name} currentAvatarPath={person.avatar_path} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-200">
          İsim
          <input
            name="name"
            required
            maxLength={80}
            defaultValue={person.name}
            className={inputClass}
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-200">
          Unvan / rol
          <input
            name="title"
            maxLength={120}
            defaultValue={person.title ?? ""}
            placeholder="Creative Technologist, Art Director…"
            className={inputClass}
          />
        </label>
      </div>

      <label className="grid gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-200">
        Kısa tanıtım
        <textarea
          name="bio"
          rows={5}
          maxLength={1000}
          defaultValue={person.bio ?? ""}
          placeholder="Uzmanlık alanları, sorumluluklar ve ekip içinde bilinmesi faydalı bilgiler…"
          className={inputClass}
        />
        <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
          En fazla 1000 karakter.
        </span>
      </label>

      <div className="flex justify-end border-t border-black/5 pt-4 dark:border-white/5">
        <SubmitButton>Profili kaydet</SubmitButton>
      </div>
    </form>
  );
}
