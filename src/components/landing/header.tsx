'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, PenTool } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-transparent">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="#" className="flex items-center gap-2" prefetch={false}>
          {/* Custom hand with pen signing icon */}
          <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 3L21 7L9 19L5 20L6 16L17 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M15 5L19 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 21C3 21 5 19 7 19C9 19 9 21 11 21C13 21 13 19 15 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-semibold text-white">DocuSeal</span>
        </Link>
        <nav className="hidden items-center gap-6 text-base font-bold md:flex">
          <Link
            href="#"
            className="text-black transition-colors hover:text-purple-700"
            prefetch={false}
          >
            Home
          </Link>
          <Link
            href="/templates"
            className="text-black transition-all hover:text-black border-b-4 border-transparent hover:border-purple-700"
            prefetch={false}
          >
            Templates
          </Link>
          <Link
            href="#"
            className="text-black transition-all hover:text-black border-b-4 border-transparent hover:border-purple-700"
            prefetch={false}
          >
            About Us
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/auth/signup">
            <Button
              variant="default"
              className="hidden rounded-lg bg-purple-900 px-6 py-2 font-bold text-white transition-colors hover:bg-purple-950 md:block"
            >
              Get Started
            </Button>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6 text-white" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-[#0B0C10] text-white">
              <div className="grid gap-4 p-4">
                <Link
                  href="#"
                  className="text-black transition-colors hover:text-gray-700"
                  prefetch={false}
                >
                  Home
                </Link>
                <Link
                  href="#"
                  className="text-black transition-colors hover:text-gray-700"
                  prefetch={false}
                >
                  About Us
                </Link>
                <Link href="/auth/signup">
                  <Button
                    variant="default"
                    className="w-full rounded-lg bg-purple-900 px-6 py-2 font-bold text-white transition-colors hover:bg-purple-950"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
