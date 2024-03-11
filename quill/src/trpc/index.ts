import { TRPCError } from '@trpc/server';
import {publicProcedure, router} from './trpc';
import {getKindeServerSession} from '@kinde-oss/kinde-auth-nextjs/server';

export const appRouter = router({
    authCallback: publicProcedure.query(async() => {
        const{getUser} = getKindeServerSession()
        const user = await getUser()

        if (!user || !user.id) {
            throw new TRPCError({ code: 'UNAUTHORIZED'})
        }
        // chekc if the user is in the database
        return { success: true}
    })
})

export type AppRouter = typeof appRouter;