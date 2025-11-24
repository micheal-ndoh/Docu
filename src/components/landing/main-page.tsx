'use client';

import { Hero } from './hero';
import { Features } from './features';

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <main className="flex-1">
        <Hero />
        <Features />
      </main>
    </div>
  );
}
