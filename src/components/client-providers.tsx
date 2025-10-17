'use client';

import React from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { Navbar } from '@/components/navbar';

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <Navbar />
      {children}
    </ThemeProvider>
  );
}
