import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const taskRouter = createTRPCRouter({
    getAll: protectedProcedure.query(({ ctx }) => {
        return ctx.db.task.findMany({
          where: {
            userId: ctx.session.user.id 
        },
        });
      }),
    
    create: protectedProcedure
        .input(z.object({ title: z.string() }))
        .mutation(({ ctx, input }) => {
            return ctx.db.task.create({
                data: {
                    title: input.title,
                    userId: ctx.session.user.id,
                },
            });
        }),

      
});