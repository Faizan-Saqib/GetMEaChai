"use server";

import connectDb from "@/db/connectDB";
import User from "@/Models/user";
import Payment from "@/Models/payment";

const SAFEPAY_HOST =
  process.env.SAFEPAY_HOST ||
  "https://sandbox.api.getsafepay.com";

/* =========================================================
   SAFEPAY CLIENT
========================================================= */

function getSafepay(safepaysecret) {
  if (!safepaysecret) {
    throw new Error("Safepay merchant secret is missing");
  }

  const safepay = require("@sfpy/node-core")(
    safepaysecret,
    {
      authType: "secret",
      host: SAFEPAY_HOST,
    }
  );

  return safepay;
}

/* =========================================================
   INITIATE SAFEPAY PAYMENT
========================================================= */

export const initiate = async (
  amount,
  to_username,
  paymentform
) => {
  await connectDb();

  console.log("==========================================");
  console.log("STARTING SAFEPAY PAYMENT");
  console.log("Receiver:", to_username);
  console.log("==========================================");

  try {
    /* -----------------------------------------------------
       FIND RECEIVER
    ----------------------------------------------------- */

    const user = await User.findOne({
      username: to_username,
    });

    if (!user) {
      throw new Error("User not found");
    }

    console.log("User found:", user.username);

    /* -----------------------------------------------------
       GET USER'S SAFEPAY CREDENTIALS
    ----------------------------------------------------- */

    const safepayid = user.safepayid;
    const safepaysecret = user.safepaysecret;

    if (!safepayid) {
      throw new Error(
        "Safepay API key is not configured for this user"
      );
    }

    if (!safepaysecret) {
      throw new Error(
        "Safepay merchant secret is not configured for this user"
      );
    }

    console.log("Safepay credentials found for:", user.username);

    /* -----------------------------------------------------
       VALIDATE AMOUNT

       Frontend sends minor units:
       Rs. 20 = 2000 paisa
    ----------------------------------------------------- */

    const amountInPaisa = Number(amount);

    if (
      !Number.isFinite(amountInPaisa) ||
      amountInPaisa <= 0 ||
      !Number.isInteger(amountInPaisa)
    ) {
      throw new Error("Invalid payment amount");
    }

    console.log("Amount in paisa:", amountInPaisa);

    /* -----------------------------------------------------
       INITIALIZE SAFEPAY USING USER'S SECRET
    ----------------------------------------------------- */

    const safepay = getSafepay(safepaysecret);

    /* -----------------------------------------------------
       CREATE PAYMENT SESSION
    ----------------------------------------------------- */

    const sessionResponse =
      await safepay.payments.session.setup({
        merchant_api_key: safepayid,
        intent: "CYBERSOURCE",
        mode: "payment",
        entry_mode: "flex",
        currency: "PKR",
        amount: amountInPaisa,
      });

    console.log(
      "Safepay session response:",
      sessionResponse
    );

    /* -----------------------------------------------------
       GET TRACKER
    ----------------------------------------------------- */

    const tracker =
      sessionResponse?.data?.tracker?.token;

    if (!tracker) {
      throw new Error(
        "Safepay tracker was not returned"
      );
    }

    console.log("Safepay tracker:", tracker);

    /* -----------------------------------------------------
       BASE URL
    ----------------------------------------------------- */

    const baseUrl =
      process.env.NEXT_PUBLIC_URL ||
      "http://localhost:3000";

    const successUrl =
      `${baseUrl}/payment/success?tracker=${encodeURIComponent(
        tracker
      )}`;

    const cancelUrl =
      `${baseUrl}/payment/cancel?tracker=${encodeURIComponent(
        tracker
      )}`;

    console.log("Success URL:", successUrl);
    console.log("Cancel URL:", cancelUrl);

    /* -----------------------------------------------------
       CREATE SAFEPAY TBT
    ----------------------------------------------------- */

    const passportResponse =
      await safepay.client.passport.create();

    /* -----------------------------------------------------
       EXTRACT TBT
    ----------------------------------------------------- */

    let tbt = passportResponse?.data;

    if (
      tbt &&
      typeof tbt === "object"
    ) {
      tbt =
        tbt.token ||
        tbt.tbt ||
        tbt.access_token;
    }

    if (
      typeof tbt !== "string" ||
      !tbt
    ) {
      throw new Error(
        "Safepay time-based token was not returned"
      );
    }

    /* -----------------------------------------------------
       CREATE CHECKOUT URL
    ----------------------------------------------------- */

    const checkoutURL =
      safepay.checkout.createCheckoutUrl({
        env: "sandbox",
        tbt,
        tracker,
        source: "hosted",
        redirect_url: successUrl,
        cancel_url: cancelUrl,
      });

    if (!checkoutURL) {
      throw new Error(
        "Safepay checkout URL was not returned"
      );
    }

    console.log("Checkout URL created successfully");

    /* -----------------------------------------------------
       SAVE PAYMENT AS PENDING
    ----------------------------------------------------- */

    const payment =
      await Payment.create({
        oid: tracker,

        // Store normal PKR amount in database
        amount: amountInPaisa / 100,

        to_user: to_username,

        name:
          paymentform?.name || "",

        message:
          paymentform?.message || "",

        done: false,
      });

    console.log(
      "Payment saved as pending:",
      payment._id
    );

    console.log("==========================================");
    console.log("SAFEPAY PAYMENT READY");
    console.log("==========================================");

    /* -----------------------------------------------------
       RETURN CHECKOUT INFORMATION
    ----------------------------------------------------- */

    return {
      success: true,
      tracker,
      checkoutURL,
    };

  } catch (error) {
    console.error(
      "========== SAFEPAY ERROR =========="
    );

    console.error(error);

    console.error(
      "==================================="
    );

    throw new Error(
      error?.message ||
        "Unable to start Safepay payment"
    );
  }
};

/* =========================================================
   VERIFY SAFEPAY PAYMENT
========================================================= */

export const verifyPayment = async (tracker) => {
  await connectDb();

  if (!tracker) {
    throw new Error(
      "Payment tracker is missing"
    );
  }

  console.log(
    "=========================================="
  );

  console.log(
    "VERIFYING SAFEPAY PAYMENT"
  );

  console.log(
    "Tracker:",
    tracker
  );

  console.log(
    "=========================================="
  );

  try {
    /* -----------------------------------------------------
       FIND PAYMENT
    ----------------------------------------------------- */

    const payment =
      await Payment.findOne({
        oid: tracker,
      });

    if (!payment) {
      throw new Error(
        "Payment record not found with this tracker ID"
      );
    }

    console.log(
      "Payment found:",
      payment._id
    );

    /* -----------------------------------------------------
       PREVENT DOUBLE VERIFICATION
    ----------------------------------------------------- */

    if (payment.done === true) {
      console.log(
        "Payment was already marked as completed"
      );

      return JSON.parse(
        JSON.stringify(payment)
      );
    }

    /* -----------------------------------------------------
       MARK PAYMENT AS COMPLETED

       IMPORTANT:
       This currently trusts the success redirect.
       For production, Safepay's transaction/payment
       status should also be checked through their API
       before setting done: true.
    ----------------------------------------------------- */

    const updatedPayment =
      await Payment.findOneAndUpdate(
        {
          oid: tracker,
        },
        {
          $set: {
            done: true,
          },
        },
        {
          new: true,
        }
      );

    if (!updatedPayment) {
      throw new Error(
        "Unable to update payment"
      );
    }

    console.log(
      "Payment marked as done:",
      updatedPayment._id
    );

    console.log(
      "Amount:",
      updatedPayment.amount
    );

    console.log(
      "Receiver:",
      updatedPayment.to_user
    );

    console.log(
      "=========================================="
    );

    /* -----------------------------------------------------
       RETURN CLEAN MONGOOSE OBJECT
    ----------------------------------------------------- */

    return JSON.parse(
      JSON.stringify(updatedPayment)
    );

  } catch (error) {
    console.error(
      "========== VERIFICATION ERROR =========="
    );

    console.error(error);

    console.error(
      "========================================"
    );

    throw new Error(
      error?.message ||
        "Unable to verify Safepay payment"
    );
  }
};