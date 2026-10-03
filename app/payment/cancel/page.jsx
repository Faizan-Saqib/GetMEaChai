"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const tracker = searchParams.get("tracker");

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl bg-slate-800 p-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
          <span className="text-3xl text-red-400">
            ×
          </span>
        </div>

        <h1 className="text-2xl font-bold text-white">
          Payment Cancelled
        </h1>

        <p className="mt-3 text-slate-400">
          Your payment was cancelled or could not be completed.
        </p>

        {tracker && (
          <p className="mt-4 break-all text-xs text-slate-500">
            Tracker: {tracker}
          </p>
        )}

        <a
          href="/"
          className="mt-6 inline-block rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white hover:bg-purple-500"
        >
          Go Back
        </a>
      </div>
    </main>
  );
}

export default function PaymentCancel() {
  return (
    <Suspense fallback={null}>
      <PaymentCancelContent />
    </Suspense>
  );
}