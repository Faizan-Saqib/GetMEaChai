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
    throw new Error(
      "Safepay merchant secret is missing"
    );
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

  console.log(
    "=========================================="
  );
  console.log(
    "STARTING SAFEPAY PAYMENT"
  );
  console.log(
    "=========================================="
  );

  console.log(
    "Payment username:",
    to_username
  );

  console.log(
    "Amount received:",
    amount
  );

  console.log(
    "Payment form:",
    paymentform
  );

  try {
    /* -----------------------------------------------------
       FIND RECEIVER
    ----------------------------------------------------- */

    const user = await User.findOne({
      username: to_username,
    });

    if (!user) {
      throw new Error(
        "User not found"
      );
    }

    console.log(
      "Receiver found:",
      user.username
    );

    /* -----------------------------------------------------
       GET USER SAFEPAY CREDENTIALS
    ----------------------------------------------------- */

    if (!user.safepayid) {
      throw new Error(
        "Safepay API key is not configured for this user"
      );
    }

    if (!user.safepaysecret) {
      throw new Error(
        "Safepay merchant secret is not configured for this user"
      );
    }

    console.log(
      "Safepay API key found: YES"
    );

    console.log(
      "Safepay merchant secret found: YES"
    );

    /* -----------------------------------------------------
       VALIDATE AMOUNT
    ----------------------------------------------------- */

    const amountInPaisa =
      Number(amount);

    if (
      !Number.isFinite(
        amountInPaisa
      ) ||
      amountInPaisa <= 0 ||
      !Number.isInteger(
        amountInPaisa
      )
    ) {
      throw new Error(
        "Invalid payment amount"
      );
    }

    console.log(
      "Amount in paisa:",
      amountInPaisa
    );

    console.log(
      "Amount in PKR:",
      amountInPaisa / 100
    );

    /* -----------------------------------------------------
       INITIALIZE SAFEPAY
    ----------------------------------------------------- */

    const safepay =
      getSafepay(
        user.safepaysecret
      );

    console.log(
      "Safepay initialized successfully"
    );

    /* -----------------------------------------------------
       CREATE PAYMENT SESSION
    ----------------------------------------------------- */

    const sessionResponse =
      await safepay.payments.session.setup({
        merchant_api_key:
          user.safepayid,

        intent:
          "CYBERSOURCE",

        mode:
          "payment",

        entry_mode:
          "flex",

        currency:
          "PKR",

        amount:
          amountInPaisa,
      });

    console.log(
      "========== SAFEPAY SESSION RESPONSE =========="
    );

    console.dir(
      sessionResponse,
      {
        depth: null,
      }
    );

    console.log(
      "=============================================="
    );

    /* -----------------------------------------------------
       GET TRACKER
    ----------------------------------------------------- */

    const tracker =
      sessionResponse
        ?.data
        ?.tracker
        ?.token;

    if (!tracker) {
      throw new Error(
        "Safepay tracker was not returned"
      );
    }

    console.log(
      "Tracker:",
      tracker
    );

    /* -----------------------------------------------------
       NEXT ACTIONS
    ----------------------------------------------------- */

    console.log(
      "========== NEXT ACTIONS =========="
    );

    console.dir(
      sessionResponse
        ?.data
        ?.tracker
        ?.next_actions,
      {
        depth: null,
      }
    );

    console.log(
      "=================================="
    );

    /* -----------------------------------------------------
       BASE URL
    ----------------------------------------------------- */

    const baseUrl =
      process.env.NEXT_PUBLIC_URL ||
      "http://localhost:3000";

    /* -----------------------------------------------------
       SUCCESS / CANCEL URL
    ----------------------------------------------------- */

    const successUrl =
      `${baseUrl}/payment/success?tracker=${encodeURIComponent(
        tracker
      )}`;

    const cancelUrl =
      `${baseUrl}/payment/cancel?tracker=${encodeURIComponent(
        tracker
      )}`;

    console.log(
      "SUCCESS URL:",
      successUrl
    );

    console.log(
      "CANCEL URL:",
      cancelUrl
    );

    /* -----------------------------------------------------
       CREATE SAFEPAY TBT
    ----------------------------------------------------- */

    console.log(
      "========== CREATING SAFEPAY TBT =========="
    );

    const passportResponse =
      await safepay.client.passport.create();

    console.log(
      "========== PASSPORT RESPONSE =========="
    );

    console.dir(
      passportResponse,
      {
        depth: null,
      }
    );

    console.log(
      "========================================"
    );

    /* -----------------------------------------------------
       EXTRACT TBT
    ----------------------------------------------------- */

    let tbt =
      passportResponse?.data;

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

    console.log(
      "Safepay TBT created successfully"
    );

    /* -----------------------------------------------------
       CREATE CHECKOUT URL
    ----------------------------------------------------- */

    const checkoutURL =
      safepay.checkout.createCheckoutUrl({
        env:
          "sandbox",

        tbt,

        tracker,

        source:
          "hosted",

        redirect_url:
          successUrl,

        cancel_url:
          cancelUrl,
      });

    console.log(
      "========== SAFEPAY CHECKOUT URL =========="
    );

    console.log(
      checkoutURL
    );

    console.log(
      "=========================================="
    );

    if (!checkoutURL) {
      throw new Error(
        "Safepay checkout URL was not returned"
      );
    }

    /* -----------------------------------------------------
       SAVE PAYMENT AS PENDING
    ----------------------------------------------------- */

    const payment =
      await Payment.create({
        oid:
          tracker,

        amount:
          amountInPaisa / 100,

        to_user:
          to_username,

        name:
          paymentform?.name || "",

        message:
          paymentform?.message || "",

        done:
          false,
      });

    console.log(
      "Payment saved as pending:",
      payment._id
    );

    /* -----------------------------------------------------
       RETURN CHECKOUT INFORMATION
    ----------------------------------------------------- */

    return {
      success:
        true,

      tracker,

      checkoutURL,
    };

  } catch (error) {
    console.error(
      "========== SAFEPAY ERROR =========="
    );

    console.error(
      error
    );

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

export const verifyPayment = async (
  tracker
) => {
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
        oid:
          tracker,
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
        "Payment is already completed"
      );

      return JSON.parse(
        JSON.stringify(
          payment
        )
      );
    }

    /* -----------------------------------------------------
       MARK PAYMENT AS DONE
    ----------------------------------------------------- */

    const updatedPayment =
      await Payment.findOneAndUpdate(
        {
          oid:
            tracker,
        },
        {
          $set: {
            done:
              true,
          },
        },
        {
          new:
            true,
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

    return JSON.parse(
      JSON.stringify(
        updatedPayment
      )
    );

  } catch (error) {
    console.error(
      "========== VERIFICATION ERROR =========="
    );

    console.error(
      error
    );

    console.error(
      "========================================"
    );

    throw new Error(
      error?.message ||
        "Unable to verify Safepay payment"
    );
  }
};

/* =========================================================
   FETCH COMPLETED PAYMENTS
========================================================= */

export const fetchpayments = async (
  username
) => {
  await connectDb();

  const payments = await Payment.find({ to_user: username, done: true,}).sort({amount: -1 }).limit(10).lean();

  return JSON.parse(
    JSON.stringify(
      payments
    )
  );
};

/* =========================================================
   FETCH USER
========================================================= */

export const fetchuser = async (username) => {
    await connectDb();

    const user = await User.findOne({ username }).lean();

    if (!user) {
        return null;
    }

    return JSON.parse(JSON.stringify(user));
};
/* =========================================================
   UPDATE PROFILE
========================================================= */

export const updateProfile = async (
    data,
    oldusername
) => {
    await connectDb();

    const ndata = data;

    console.log(
        "=========================================="
    );
    console.log(
        "UPDATING USER PROFILE"
    );
    console.log(
        "=========================================="
    );

    console.log(
        "Email:",
        ndata?.email
    );

    console.log(
        "Old Username:",
        oldusername
    );

    console.log(
        "New Username:",
        ndata?.username
    );

    console.log(
        "Safepay ID received:",
        !!ndata?.safepayid
    );

    console.log(
        "Safepay Secret received:",
        !!ndata?.safepaysecret
    );

    /* =====================================================
       VALIDATE REQUIRED DATA
    ===================================================== */

    if (!ndata?.email) {
        return {
            error: "Email is required",
        };
    }

    if (!ndata?.username) {
        return {
            error: "Username is required",
        };
    }

    /* =====================================================
       VALIDATE USERNAME CHANGE
    ===================================================== */

    const usernameChanged =
        oldusername !== ndata.username;

    if (usernameChanged) {
        console.log(
            "Username is being changed:"
        );

        console.log(
            `${oldusername} → ${ndata.username}`
        );

        const existingUser =
            await User.findOne({
                username: ndata.username,
            });

        if (existingUser) {
            return {
                error:
                    "Username already exists",
            };
        }
    }

    /* =====================================================
       BUILD USER UPDATE DATA
    ===================================================== */

    const updateData = {
        name:
            ndata.name || "",

        username:
            ndata.username,

        profilepic:
            ndata.profilepic || "",

        coverpic:
            ndata.coverpic || "",
    };

    /* =====================================================
       SAFEPAY ID
       
       Only update if a value was provided.
    ===================================================== */

    if (
        typeof ndata.safepayid ===
            "string" &&
        ndata.safepayid.trim() !== ""
    ) {
        updateData.safepayid =
            ndata.safepayid.trim();
    }

    /* =====================================================
       SAFEPAY SECRET

       Only update if a value was provided.

       This prevents an empty secret from
       deleting the existing secret.
    ===================================================== */

    if (
        typeof ndata.safepaysecret ===
            "string" &&
        ndata.safepaysecret.trim() !== ""
    ) {
        updateData.safepaysecret =
            ndata.safepaysecret.trim();
    }

    /* =====================================================
       UPDATE USER
    ===================================================== */

    const updatedUser =
        await User.findOneAndUpdate(
            {
                email:
                    ndata.email,
            },

            {
                $set:
                    updateData,
            },

            {
                returnDocument:
                    "after",

                runValidators:
                    true,
            }
        );

    if (!updatedUser) {
        return {
            error:
                "User not found",
        };
    }

    console.log(
        "User profile updated successfully."
    );

    /* =====================================================
       IMPORTANT:
       UPDATE OLD PAYMENTS WHEN USERNAME CHANGES
    ===================================================== */

    if (usernameChanged) {
        console.log(
            "=========================================="
        );

        console.log(
            "UPDATING PAYMENT USERNAMES"
        );

        console.log(
            "Old payment username:",
            oldusername
        );

        console.log(
            "New payment username:",
            ndata.username
        );

        console.log(
            "=========================================="
        );

        const paymentUpdate =
            await Payment.updateMany(
                {
                    to_user:
                        oldusername,
                },

                {
                    $set: {
                        to_user:
                            ndata.username,
                    },
                }
            );

        console.log(
            "Payments matched:",
            paymentUpdate.matchedCount
        );

        console.log(
            "Payments modified:",
            paymentUpdate.modifiedCount
        );

        console.log(
            "All payments moved to new username."
        );
    }

    /* =====================================================
       SAFEPAY DEBUG
    ===================================================== */

    console.log(
        "Safepay ID stored:",
        !!updatedUser.safepayid
    );

    console.log(
        "Safepay Secret stored:",
        !!updatedUser.safepaysecret
    );

    console.log(
        "=========================================="
    );

    /* =====================================================
       REMOVE SECRET BEFORE RETURNING TO CLIENT
    ===================================================== */

    const cleanUser =
        updatedUser.toObject();

    delete cleanUser.safepaysecret;

    return JSON.parse(
        JSON.stringify(
            cleanUser
        )
    );
};

