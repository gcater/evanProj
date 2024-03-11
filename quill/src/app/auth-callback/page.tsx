import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "../_trpc/client";

const Page = async () => {
    const router = useRouter()

    const searchParams = useSearchParams()
    const origin = searchParams.get('origin')



    console.log('here we are in the auth callback page')
    const {data, isLoading} = trpc.authCallback.useQuery()
    if(data?.success){
        //user is synced to db
        router.push(origin ? `/${origin}`: '/dashboard')
    }
    else{
        console.log('user not synced to db')
    }
    
}

export default Page;