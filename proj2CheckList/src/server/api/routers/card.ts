import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const cardRouter = createTRPCRouter({
    getAll: protectedProcedure.query(({ ctx }) => {
        return ctx.db.card.findMany({
            where:{
                userId: ctx.session.user.id
            }
        });
      }),
    
    create: protectedProcedure
        .input(z.object({ title: z.string(), }))
        .mutation(({ ctx, input }) => {
            return ctx.db.card.create({
                data: {
                    title: input.title,
                    userId: ctx.session.user.id,

                },
            });
        }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(({ ctx, input }) => {
          return ctx.db.card.delete({
              where: {
                  id: input.id,
                  userId: ctx.session.user.id, // Ensure the card
              },
          });
      }),
});