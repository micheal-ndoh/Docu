'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FilePenLine } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#1e0836] p-4">
      <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center space-y-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white">
          <FilePenLine className="h-10 w-10 text-white" />
        </div>
        
        <h1 className="text-5xl font-bold text-white">DocuSeal</h1>
        <p className="text-lg text-white/90">Sign Your Documents with Confidence</p>
        
        <div className="pt-8">
          <Button asChild size="lg" className="bg-white text-[#1e0836] hover:bg-white/90">
            <Link href="/auth/signin">
              Sign In
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
