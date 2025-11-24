'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Mountain } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-transparent backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="#" className="flex items-center gap-2" prefetch={false}>
          <Mountain className="h-6 w-6" />
          <span className="font-semibold text-white">Docu</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link
            href="#"
            className="text-gray-300 transition-colors hover:text-white"
            prefetch={false}
          >
            Home
          </Link>
          <Link
            href="#"
            className="text-gray-300 transition-colors hover:text-white"
            prefetch={false}
          >
            About Us
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/auth/signup">
            <Button
              variant="default"
              className="hidden rounded-full bg-purple-600 px-6 py-2 text-white transition-colors hover:bg-purple-700 md:block"
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
                  className="text-gray-300 transition-colors hover:text-white"
                  prefetch={false}
                >
                  Home
                </Link>
                <Link
                  href="#"
                  className="text-gray-300 transition-colors hover:text-white"
                  prefetch={false}
                >
                  About Us
                </Link>
                <Link href="/auth/signup">
                  <Button
                    variant="default"
                    className="w-full rounded-full bg-purple-600 px-6 py-2 text-white transition-colors hover:bg-purple-700"
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
