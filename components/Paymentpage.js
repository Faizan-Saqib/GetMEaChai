"use client";

import React, { useEffect, useState } from "react";
import { initiate, fetchuser, fetchpayments, } from "@/actions/useractions";
import { useSearchParams } from 'next/navigation'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Bounce } from 'react-toastify';


const PaymentPage = ({ username }) => {
  const [paymentform, setPaymentform] = useState({ name: "", message: "", amount: "",});
  const searchParams = useSearchParams()
  const [currentUser, setCurrentUser] = useState({});
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getData();
  }, []);

   useEffect(() => {
        if(searchParams.get("paymentdone") == "true"){
        toast('Thanks for your donation!', {
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
        }
     
    }, [])

  const handleChange = (e) => {
    setPaymentform({
      ...paymentform,
      [e.target.name]: e.target.value,
    });
  };

  const getData = async () => {
    let u = await fetchuser(username)
    setCurrentUser(u)
    let dbpayments = await fetchpayments(username)
    setPayments(dbpayments)
    console.log(u, dbpayments)
  };

  /*
   * =====================================================
   * START PAYMENT
   * =====================================================
   *
   * Safepay expects minor units:
   *
   * Rs. 10 = 1000 paisa
   * Rs. 20 = 2000 paisa
   * Rs. 30 = 3000 paisa
   *
   * The server action returns:
   *
   * {
   *   success: true,
   *   tracker: "...",
   *   checkoutURL: "https://sandbox.api.getsafepay.com/..."
   * }
   *
   * We DO NOT use captureContext here.
   */

  const pay = async (amountInMinorUnits) => {
    try {
      if (
        !amountInMinorUnits ||
        Number(amountInMinorUnits) <= 0
      ) {
        alert("Please enter a valid amount");
        return;
      }

      if (!paymentform.name.trim()) {
        alert("Please enter your name");
        return;
      }

      setLoading(true);

      const paymentAmount = Number(
        amountInMinorUnits
      );

      console.log("==============================");
      console.log("STARTING SAFEPAY PAYMENT");
      console.log("Username:", username);
      console.log("Payment amount:", paymentAmount);
      console.log("Payment form:", paymentform);
      console.log("==============================");

      /*
       * Call the SERVER ACTION.
       *
       * Safepay secret/API credentials stay
       * on the server.
       */

      const response = await initiate(
        paymentAmount,
        username,
        paymentform
      );

      console.log(
        "========== SAFEPAY CLIENT RESPONSE =========="
      );

      console.dir(response, {
        depth: null,
      });

      console.log(
        "============================================="
      );

      /*
       * Your current server action returns checkoutURL.
       *
       * DO NOT check:
       *
       * response.captureContext
       *
       * because your current flow does not return it.
       */

      const checkoutURL =
        response?.checkoutURL;

      if (!checkoutURL) {
        console.error(
          "Safepay checkout URL was not returned:",
          response
        );

        throw new Error(
          "Safepay checkout URL was not returned"
        );
      }

      console.log(
        "========== REDIRECTING TO SAFEPAY =========="
      );

      console.log(checkoutURL);

      console.log(
        "============================================="
      );

      /*
       * Redirect directly to Safepay hosted checkout.
       */

      window.location.assign(checkoutURL);

    } catch (error) {
      console.error(
        "========== PAYMENT ERROR =========="
      );

      console.error(error);

      console.error(
        "==================================="
      );

      alert(
        error?.message ||
          "Something went wrong while starting the payment."
      );

      setLoading(false);
    }
  };

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
      {/* Cover */}

      <div className="cover h-[550px]">
        <img
          src={currentUser.coverpic}
          alt=""
          className="w-full object-cover"
        />

        <div className="profilpic h-8 relative">
          <img
            className="h-32 border-2 border-white rounded-full w-32 object-cover absolute -bottom-7 right-[45%]"
            src={currentUser.profilepic}
            alt=""
          />
        </div>

        <div className="texts flex flex-col gap-1 justify-center items-center relative top-8">
          <div className="font-bold text-lg">
            @{username}
          </div>

          <div className="text-gray-500 text-md">
            Lets help {username} get a Pie!
          </div>

          <div className="text-gray-500 text-md">
            {payments.length} Payments - Rs.{payments.reduce((a, b) => a + b.amount, 0)} raised.
          </div>
        </div>
      </div>

      {/* Main Boxes */}

      <div className="boxes flex gap-7 justify-center items-center w-full h-[450px]">

        {/* Supporters */}

        <div className="box1 w-[44vw] h-[400px] bg-slate-700 rounded-3xl">
          <h1 className="p-6 font-bold text-2xl">
            Top 10 Supporters
          </h1>

          <div className="supporterslist px-8 flex flex-col gap-4 overflow-scroll min-w-96 max-w-[600px] min-h-[300px] max-h-[300px]">

            {payments.length > 0 ? (
              payments.map((payment, index) => (
                <div
                  className="supporter flex justify-start items-center gap-2"
                  key={payment._id || index}
                >
                  <img
                    className="w-8 h-8 rounded-full"
                    src="/avatar.gif"
                    alt=""
                  />

                  <h1>
                    {payment.name || "Anonymous"} donated
                  </h1>

                  <h1>
                    Rs. {payment.amount}
                  </h1>

                  <h1>
                    Said
                  </h1>

                  <h1>
                    &quot;{payment.message || ""}&quot;
                  </h1>
                </div>
              ))
            ) : (
              <>
              <div>
                <h1>
                    No payments to show
                  </h1>
              </div>
              </>
            )}

          </div>
        </div>

        {/* Payment */}

        <div className="box2 w-[44vw] h-[400px] bg-slate-700 rounded-3xl p-6 flex flex-col justify-between">

          <div>
            <h1 className="font-bold text-2xl mb-4 text-white">
              Make a Payment
            </h1>
          </div>

          <div className="payment space-y-3 flex-1 flex flex-col justify-center">

            {/* Name */}

            <input
              onChange={handleChange}
              value={paymentform.name}
              name="name"
              type="text"
              placeholder="Enter Name"
              disabled={loading}
              className="w-full rounded-xl border border-slate-600/50 bg-slate-800/40 px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:border-purple-500 focus:bg-slate-800/80 focus:outline-none transition-all duration-200"
            />

            {/* Message */}

            <input
              onChange={handleChange}
              value={paymentform.message}
              name="message"
              type="text"
              placeholder="Enter Message"
              disabled={loading}
              className="w-full rounded-xl border border-slate-600/50 bg-slate-800/40 px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:border-purple-500 focus:bg-slate-800/80 focus:outline-none transition-all duration-200"
            />

            {/* Amount */}

            <input
              onChange={handleChange}
              value={paymentform.amount}
              name="amount"
              type="number"
              min="1"
              placeholder="Enter Amount"
              disabled={loading}
              className="w-full rounded-xl border border-slate-600/50 bg-slate-800/40 px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:border-purple-500 focus:bg-slate-800/80 focus:outline-none transition-all duration-200"
            />

            {/* Preset amounts */}

            <div className="grid grid-cols-3 gap-2 pt-3">

              {/* Rs. 10 */}

              <div className="flex flex-col justify-end">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => pay(1000)}
                  className="cursor-pointer w-full rounded-xl border border-slate-600/50 bg-slate-800/30 py-2 text-xs font-medium text-slate-300 transition-all duration-200 hover:border-slate-500 hover:bg-slate-800/60 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Pay Rs. 10
                </button>
              </div>

              {/* Rs. 20 */}

              <div className="relative flex flex-col justify-end">

                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded bg-gradient-to-r from-purple-500 to-indigo-500 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white uppercase shadow-[0_0_10px_rgba(147,51,234,0.4)]">
                  Valued
                </span>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => pay(2000)}
                  className="cursor-pointer w-full rounded-xl border border-purple-500 bg-purple-500/20 py-2 text-xs font-semibold text-purple-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Pay Rs. 20
                </button>

              </div>

              {/* Rs. 30 */}

              <div className="flex flex-col justify-end">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => pay(3000)}
                  className="cursor-pointer w-full rounded-xl border border-slate-600/50 bg-slate-800/30 py-2 text-xs font-medium text-slate-300 transition-all duration-200 hover:border-slate-500 hover:bg-slate-800/60 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Pay Rs. 30
                </button>
              </div>

            </div>
          </div>

          {/* Pay button */}

          <div className="pt-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                const amount = Number(
                  paymentform.amount
                );

                if (!amount || amount <= 0) {
                  alert("Please enter a valid amount");
                  return;
                }

                pay(amount * 100);
              }}
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:from-purple-500 hover:to-indigo-500 hover:shadow-[0_0_15px_rgba(147,51,234,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Starting Payment..."
                : "Pay"}
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default PaymentPage;
