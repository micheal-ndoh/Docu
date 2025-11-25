'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, PenTool, LogOut } from 'lucide-react';
import { useSession, signOut } from '@/lib/auth-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();

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
            href="/"
            className={`transition-colors ${pathname === '/' ? 'text-purple-700' : 'text-black hover:text-purple-700'
              }`}
            prefetch={false}
          >
            Home
          </Link>
          <Link
            href="/about"
            className={`transition-all border-b-4 ${pathname === '/about'
              ? 'text-purple-700 border-purple-700'
              : 'text-black border-transparent hover:text-black hover:border-purple-700'
              }`}
            prefetch={false}
          >
            About Us
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          {/* Show User Menu if logged in, otherwise show Get Started button */}
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-11 w-11 rounded-full">
                  <Avatar className="h-11 w-11 border-2 border-purple-200">
                    <AvatarImage
                      src={session.user?.image || "/avatars/01.png"}
                      alt={session.user?.name || "User"}
                    />
                    <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold">
                      {session.user?.name
                        ? session.user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium">
                    {session.user?.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {session.user?.email}
                  </p>
                </div>
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth/signup">
              <Button
                variant="default"
                className="hidden rounded-lg bg-purple-900 px-6 py-2 font-bold text-white transition-colors hover:bg-purple-950 md:block"
              >
                Get Started
              </Button>
            </Link>
          )}

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
                {session ? (
                  <Button
                    onClick={() => signOut()}
                    variant="default"
                    className="w-full rounded-lg bg-red-600 px-6 py-2 font-bold text-white transition-colors hover:bg-red-700"
                  >
                    Log out
                  </Button>
                ) : (
                  <Link href="/auth/signup">
                    <Button
                      variant="default"
                      className="w-full rounded-lg bg-purple-900 px-6 py-2 font-bold text-white transition-colors hover:bg-purple-950"
                    >
                      Get Started
                    </Button>
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
