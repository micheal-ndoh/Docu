'use client';

import React from 'react';
import { useSession } from '@/lib/auth-client';
import { ThemeProvider } from '@/components/theme-provider';
import { Navbar } from '@/components/navbar';

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {session && <Navbar />}
      {children}
    </ThemeProvider>
  );
}
