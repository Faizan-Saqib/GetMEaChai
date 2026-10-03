"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { verifyPayment } from "@/actions/useractions";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Bounce } from "react-toastify";

function SuccessContent() {
  const searchParams = useSearchParams();

  const rawTracker = searchParams.get("tracker");

  // Clean accidental duplicate ?tracker=...
  const tracker = rawTracker?.split("?")[0]?.trim();

  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("Verifying your payment...");

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      try {
        console.log("==========================================");
        console.log("VERIFYING SAFEPAY PAYMENT");
        console.log("Raw tracker:", rawTracker);
        console.log("Clean tracker:", tracker);
        console.log("==========================================");

        const result = await verifyPayment(tracker);

        console.log("========== VERIFY RESULT ==========");
        console.dir(result, { depth: null });
        console.log("===================================");

        if (cancelled) return;

        // SUCCESS
        if (result?.paid === true) {
          setStatus("success");

          toast("Thanks for your donation!", {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
            transition: Bounce,
          });

          return;
        }

        // FAILED
        if (result?.failed === true) {
          setStatus("failed");
          setMessage("Your payment was not completed.");
          return;
        }

        // PENDING
        if (result?.pending === true) {
          setStatus("pending");
          setMessage("Your payment is still being processed.");
          return;
        }

        // UNKNOWN
        setStatus("error");
        setMessage("We could not determine the payment status.");
      } catch (error) {
        console.error("❌ PAYMENT VERIFY ERROR:", error);

        if (cancelled) return;

        setStatus("error");
        setMessage(error?.message || "Unable to verify your payment.");
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [tracker, rawTracker]);

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Bounce}
      />

      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
        <div className="w-full max-w-md rounded-3xl bg-slate-800 p-8 text-center shadow-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-3xl text-green-400">
            ✓
          </div>

          <h1 className="text-2xl font-bold text-white">
            Payment Successful
          </h1>

          <p className="mt-3 text-slate-400">
            payment verified!
          </p>

          <p className="mt-4 break-all text-xs text-slate-500">
            Tracker:
            <br />
            {tracker}
          </p>
        </div>
      </main>
    </>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}