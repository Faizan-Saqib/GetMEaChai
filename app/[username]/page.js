import React from "react";
import PaymentPage from "@/components/Paymentpage";
import { notFound } from "next/navigation";
import connectDb from "@/db/connectDB";
import User from "@/Models/user";

const Username = async ({ params }) => {
  const { username } = await params;

  await connectDb();

  const u = await User.findOne({ username });

  if (!u) {
    return notFound();
  }

  return (
    <>
      <PaymentPage username={username} />
    </>
  );
};

export default Username;