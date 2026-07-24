"use client";

export default function ErrorBoundary({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm dark:border-rose-900 dark:bg-rose-950/40">
      <h2 className="mb-1 font-semibold text-rose-700 dark:text-rose-300">
        Bir şeyler ters gitti
      </h2>
      <p className="mb-4 text-rose-600 dark:text-rose-400">
        {error.message || "Beklenmeyen bir hata oluştu."}
      </p>
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-500"
      >
        Tekrar dene
      </button>
    </div>
  );
}
