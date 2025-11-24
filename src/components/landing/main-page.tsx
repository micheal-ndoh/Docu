'use client';

import { Header } from './header';
import { Hero } from './hero';
import { Features } from './features';

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0B0C10]">
      <Header />
      <main className="flex-1">
        <Hero />
        <Features />
      </main>
    </div>
  );
}
