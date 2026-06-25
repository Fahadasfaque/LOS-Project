'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-full border-4 border-t-indigo-500 border-r-indigo-500 border-slate-800 animate-spin"></div>
        <p className="text-sm font-medium text-slate-400">Loading Loan Origination System...</p>
      </div>
    </div>
  );
}
