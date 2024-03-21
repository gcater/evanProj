import Dashboard from "@/components/Dashboard";
import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import React from "react";

const Page = async (): Promise<JSX.Element> => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (user?.id === null || user?.id === "")
    redirect("/auth-callback?origin=dashboard");

  const dbUser = await db.user.findFirst({
    where: {
      id: user?.id,
    },
  });

  if (dbUser === null) redirect("/auth-callback?origin=dashboard");

  return <Dashboard />;
};

export default Page;
