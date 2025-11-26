'use client';

import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';
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
          <Button
            onClick={async () => {
              console.log('Sign in button clicked');
              try {
                const result = await signIn('keycloak', {
                  callbackUrl: '/submissions',
                  redirect: true
                });
                console.log('Sign in result:', result);
              } catch (error) {
                console.error('Sign in error:', error);
              }
            }}
            size="lg"
            className="bg-white text-[#1e0836] hover:bg-white/90"
          >
            Sign In with Keycloak
          </Button>
        </div>
      </div>
    </main>
  );
}
