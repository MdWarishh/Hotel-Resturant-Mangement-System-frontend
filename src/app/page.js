'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/public');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="spinner border-4 border-orange-600 border-t-transparent rounded-full w-12 h-12 animate-spin"></div>
    </div>
  );
}