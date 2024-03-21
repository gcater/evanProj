import { PLANS } from "@/config/stripe";
import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  // apiVersion: "2023-08-16",
  typescript: true,
});

interface SubscriptionPlan {
  stripeSubscriptionId?: string;
  stripeCurrentPeriodEnd?: Date;
  stripeCustomerId?: string;
  isSubscribed: boolean;
  isCanceled: boolean;
  // Add other properties as needed
}

export async function getUserSubscriptionPlan(): Promise<SubscriptionPlan> {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (user === null) throw new TRPCError({ code: "UNAUTHORIZED" });

  if (user.id === null) {
    return {
      ...PLANS[0],
      isSubscribed: false,
      isCanceled: false,
      stripeCurrentPeriodEnd: undefined,
    };
  }

  const dbUser = await db.user.findFirst({
    where: {
      id: user.id,
    },
  });

  if (dbUser === null) {
    return {
      ...PLANS[0],
      isSubscribed: false,
      isCanceled: false,
      stripeCurrentPeriodEnd: undefined,
    };
  }

  const isSubscribed = Boolean(
    dbUser.stripePriceId !== null &&
      dbUser.stripePriceId !== "" &&
      dbUser.stripeCurrentPeriodEnd !== null &&
      // 86400000 = 1 day
      dbUser.stripeCurrentPeriodEnd.getTime() + 86_400_000 > Date.now()
  );

  const plan = isSubscribed
    ? PLANS.find((plan) => plan.price.priceIds.test === dbUser.stripePriceId)
    : null;

  let isCanceled = false;
  if (
    isSubscribed &&
    dbUser.stripeSubscriptionId !== null &&
    dbUser.stripeSubscriptionId !== ""
  ) {
    const stripePlan = await stripe.subscriptions.retrieve(
      dbUser.stripeSubscriptionId
    );
    isCanceled = stripePlan.cancel_at_period_end;
  }

  return {
    ...plan,
    stripeSubscriptionId: dbUser.stripeSubscriptionId ?? undefined,
    stripeCurrentPeriodEnd: dbUser.stripeCurrentPeriodEnd ?? undefined,
    stripeCustomerId: dbUser.stripeCustomerId ?? undefined,
    isSubscribed,
    isCanceled,
  };
}
