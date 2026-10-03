"use client";

import { useSearchParams } from "next/navigation";

export default function CancelPage() {
  const searchParams = useSearchParams();

  const tracker = searchParams.get("tracker");

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-md rounded-3xl bg-slate-800 p-8 text-center shadow-xl">

        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-3xl text-red-400">
          ✕
        </div>

        <h1 className="text-2xl font-bold text-white">
          Payment Cancelled
        </h1>

        <p className="mt-3 text-slate-400">
          Your Safepay payment was cancelled.
        </p>

        {tracker && (
          <p className="mt-4 break-all text-xs text-slate-500">
            Tracker: {tracker}
          </p>
        )}

        <button
          onClick={() => window.history.back()}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-sm font-semibold text-white transition hover:from-purple-500 hover:to-indigo-500"
        >
          Go Back
        </button>

      </div>
    </main>
  );
}