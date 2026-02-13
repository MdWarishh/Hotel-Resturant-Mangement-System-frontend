'use client';

import { redirect, useRouter } from 'next/navigation';

export default function Home() {

   redirect('/public');

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="spinner"></div>
    </div>
  );
}