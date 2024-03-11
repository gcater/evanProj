"use client"
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { trpc } from '../_trpc/client';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams()
  const origin = searchParams.get('origin')
  const { data, error, isLoading } = trpc.authCallback.useQuery(undefined, {
    retry: true,
    retryDelay: 500,
  });

  // Handle successful query
  useEffect(() => {
    if (data && data.success) {
      router.push(origin || '/dashboard');
    }
  }, [data, router]);

  // Handle query error
  useEffect(() => {
    if (error && error.data?.code === 'UNAUTHORIZED') {
      router.push('/sign-in');
    }
  }, [error, router]);

  if (isLoading) {
    return (
      <div className="w-full mt-24 flex justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-800" />
          <h3 className="font-semibold text-xl">
            Setting up your account...
          </h3>
          <p>You will be redirected automatically.</p>
        </div>
      </div>
    );
  }

  // Return null or a placeholder as needed if the component should not render anything else
  return null;
};

export default Page;