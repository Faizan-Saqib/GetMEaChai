"use client";

import React, {
  useEffect,
  useState,
} from "react";

import {
  useSession,
} from "next-auth/react";

import {
  useRouter,
} from "next/navigation";

import {
  fetchuser,
  updateProfile,
} from "@/actions/useractions";

import {
  ToastContainer,
  toast,
  Bounce,
} from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

const Dashboard = () => {
  const {
    data: session,
    update,
    status,
  } = useSession();

  const router = useRouter();

  /* =====================================================
     FORM STATE
  ===================================================== */

  const [form, setform] =
    useState({
      name: "",
      email: "",
      username: "",
      profilepic: "",
      coverpic: "",
      safepayid: "",
      safepaysecret: "",
    });

  const [saving, setSaving] =
    useState(false);

  /* =====================================================
     AUTH + LOAD USER
  ===================================================== */

  useEffect(() => {
    if (
      status === "unauthenticated"
    ) {
      router.push("/login");

      return;
    }

    if (
      status === "authenticated" &&
      session?.user?.name
    ) {
      getData();
    }
  }, [
    router,
    session,
    status,
  ]);

  /* =====================================================
     FETCH USER
  ===================================================== */

  const getData = async () => {
    try {
        const u = await fetchuser(session.user.name);

        if (u) {
            setform({
                name: u.name || "",
                email: u.email || "",
                username: u.username || "",
                profilepic: u.profilepic || "",
                coverpic: u.coverpic || "",
                safepayid: u.safepayid || "",
                safepaysecret: u.safepaysecret || "",
            });
        }
    } catch (error) {
        console.error("Error fetching user:", error);

        toast.error("Failed to load profile!", {
            position: "top-right",
            autoClose: 5000,
            theme: "light",
            transition: Bounce,
        });
    }
};

  /* =====================================================
     HANDLE INPUT CHANGE
  ===================================================== */

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setform((previous) => ({
      ...previous,
      [name]:
        value,
    }));
  };

  /* =====================================================
     SAVE PROFILE
  ===================================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);

    try {
      console.log(
        "======================================"
      );

      console.log(
        "SAVING PROFILE"
      );

      console.log(
        "======================================"
      );

      console.log(
        "Username:",
        form.username
      );

      console.log(
        "Safepay ID provided:",
        !!form.safepayid
      );

      console.log(
        "Safepay Secret provided:",
        !!form.safepaysecret
      );

      /*
       * NEVER console.log the actual
       * Safepay secret.
       */

      /* -------------------------------------------------
         SEND PROFILE TO SERVER
      ------------------------------------------------- */

      const updatedData =
        await updateProfile(
          form,
          session.user.name
        );

      console.log(
        "Profile update response:",
        updatedData
      );

      /* -------------------------------------------------
         SERVER-SIDE ERROR
      ------------------------------------------------- */

      if (
        updatedData?.error
      ) {
        toast.error(
          updatedData.error,
          {
            position:
              "top-right",

            autoClose:
              5000,

            hideProgressBar:
              false,

            closeOnClick:
              true,

            pauseOnHover:
              true,

            draggable:
              true,

            theme:
              "light",

            transition:
              Bounce,
          }
        );

        return;
      }

      /* -------------------------------------------------
         SUCCESS
      ------------------------------------------------- */

      if (updatedData) {
        /*
         * IMPORTANT:
         *
         * The server intentionally removes
         * safepaysecret from updatedData.
         *
         * So DO NOT do:
         *
         * setform(updatedData)
         *
         * because that would clear the secret
         * from the local state.
         *
         * Instead merge the returned data into
         * the existing form.
         */

        setform((previous) => ({
          ...previous,

          ...updatedData,

          /*
           * Keep the secret that the user just
           * entered in local state.
           *
           * It is NOT returned by the server.
           */
          safepaysecret:
            previous.safepaysecret,
        }));

        /* -------------------------------------------------
           UPDATE NEXTAUTH SESSION
        ------------------------------------------------- */

        await update({
          name:
            updatedData.name,

          username:
            updatedData.username,
        });

        /* -------------------------------------------------
           SUCCESS TOAST
        ------------------------------------------------- */

        toast.success(
          "Profile Updated!",
          {
            position:
              "top-right",

            autoClose:
              5000,

            hideProgressBar:
              false,

            closeOnClick:
              true,

            pauseOnHover:
              true,

            draggable:
              true,

            pauseOnFocusLoss:
              true,

            theme:
              "light",

            transition:
              Bounce,
          }
        );

        console.log(
          "Profile saved successfully."
        );

        console.log(
          "Safepay credentials were sent to the server."
        );
      }

    } catch (error) {
      console.error(
        "Profile update error:",
        error
      );

      toast.error(
        "Something went wrong while updating your profile!",
        {
          position:
            "top-right",

          autoClose:
            5000,

          hideProgressBar:
            false,

          closeOnClick:
            true,

          pauseOnHover:
            true,

          draggable:
            true,

          pauseOnFocusLoss:
            true,

          theme:
            "light",

          transition:
            Bounce,
        }
      );

    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (
    status === "loading"
  ) {
    return (
      <div className="text-white text-center mt-10">
        Loading profile data...
      </div>
    );
  }

  /* =====================================================
     DASHBOARD
  ===================================================== */

  return (
    <>
      {/* =================================================
          TOAST
      ================================================= */}

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

      {/* =================================================
          BACKGROUND
      ================================================= */}

      <div className="relative flex min-h-screen items-center justify-center bg-[#050B14] p-4 font-sans text-white">

        <div className="absolute inset-0 bg-[radial-gradient(#141d2b_1px,transparent_1px)] [background-size:16px_16px] opacity-60">
        </div>

        {/* =================================================
            DASHBOARD
        ================================================= */}

        <div className="relative z-10 w-full max-w-xl p-6">

          <h1 className="mb-6 text-center text-2xl font-bold tracking-wide">
            Welcome to your Dashboard
          </h1>

          <form
            onSubmit={
              handleSubmit
            }
            className="space-y-4"
          >

            {/* =================================================
                NAME
            ================================================= */}

            <div>
              <label className="block text-sm font-medium mb-1.5 opacity-90">
                Name
              </label>

              <input
                type="text"
                name="name"
                value={
                  form.name || ""
                }
                onChange={
                  handleChange
                }
                className="w-full rounded-lg bg-[#242D3D] px-4 py-3 text-white outline-none"
              />
            </div>

            {/* =================================================
                EMAIL
            ================================================= */}

            <div>
              <label className="block text-sm font-medium mb-1.5 opacity-90">
                Email
              </label>

              <input
                type="email"
                name="email"
                value={
                  form.email || ""
                }
                disabled
                className="w-full rounded-lg bg-[#242D3D] px-4 py-3 text-white opacity-50 outline-none cursor-not-allowed"
              />
            </div>

            {/* =================================================
                USERNAME
            ================================================= */}

            <div>
              <label className="block text-sm font-medium mb-1.5 opacity-90">
                Username
              </label>

              <input
                type="text"
                name="username"
                value={
                  form.username || ""
                }
                onChange={
                  handleChange
                }
                className="w-full rounded-lg bg-[#242D3D] px-4 py-3 text-white outline-none"
              />
            </div>

            {/* =================================================
                PROFILE PICTURE
            ================================================= */}

            <div>
              <label className="block text-sm font-medium mb-1.5 opacity-90">
                Profile Picture
              </label>

              <input
                type="text"
                name="profilepic"
                value={
                  form.profilepic ||
                  ""
                }
                onChange={
                  handleChange
                }
                className="w-full rounded-lg bg-[#242D3D] px-4 py-3 text-white outline-none"
              />
            </div>

            {/* =================================================
                COVER PICTURE
            ================================================= */}

            <div>
              <label className="block text-sm font-medium mb-1.5 opacity-90">
                Cover Picture
              </label>

              <input
                type="text"
                name="coverpic"
                value={
                  form.coverpic ||
                  ""
                }
                onChange={
                  handleChange
                }
                className="w-full rounded-lg bg-[#242D3D] px-4 py-3 text-white outline-none"
              />
            </div>

            {/* =================================================
                SAFEPAY API KEY
            ================================================= */}

            <div>
              <label className="block text-sm font-medium mb-1.5 opacity-90">
                Safepay ID
              </label>

              <input
                type="text"
                name="safepayid"
                value={
                  form.safepayid ||
                  ""
                }
                onChange={
                  handleChange
                }
                placeholder="Enter your Safepay API key"
                autoComplete="off"
                className="w-full rounded-lg bg-[#242D3D] px-4 py-3 text-white outline-none"
              />
            </div>

            {/* =================================================
                SAFEPAY MERCHANT SECRET
            ================================================= */}

            <div>
              <label className="block text-sm font-medium mb-1.5 opacity-90">
                Safepay Secret
              </label>

              <input
                type="password"
                name="safepaysecret"
                value={
                  form.safepaysecret ||
                  ""
                }
                onChange={
                  handleChange
                }
                placeholder="Enter your Safepay merchant secret"
                autoComplete="new-password"
                className="w-full rounded-lg bg-[#242D3D] px-4 py-3 text-white outline-none"
              />

              <p className="mt-1.5 text-xs text-gray-400">
                Leave this blank if you do not want to
                change your existing Safepay secret.
              </p>
            </div>

            {/* =================================================
                SAVE BUTTON
            ================================================= */}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-[#0070F3] py-3 font-semibold text-white hover:bg-[#0060d6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving
                ? "Saving..."
                : "Save"}
            </button>

          </form>
        </div>
      </div>
    </>
  );
};

export default Dashboard;

