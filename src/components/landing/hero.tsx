'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="relative h-[80vh] w-full overflow-hidden clip-folder bg-gradient-to-r from-purple-900 via-indigo-800 to-orange-600">
      <div className="container mx-auto flex h-full flex-col items-center justify-center text-center">
        <div className="max-w-3xl">
          <p className="mb-4 text-lg font-medium text-gray-200">
            Secure, Streamlined, Signed.
          </p>
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-white md:text-6xl">
            Manage Your Documents with Confidence
          </h1>
          <p className="mb-8 text-lg text-gray-300">
            From upload to e-signature, Docu provides a seamless and secure
            workflow for all your important documents. Get started in seconds.
          </p>
        </div>
      </div>
    </section>
  );
}
