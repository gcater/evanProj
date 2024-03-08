import { postRouter } from "~/server/api/routers/post";
import { taskRouter } from "~/server/api/routers/task";
import { cardRouter } from "./routers/card";
import { createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  task: taskRouter,
  card: cardRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
