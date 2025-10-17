import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // Minimal pass-through middleware.
  // We intentionally avoid importing next-auth here to keep the Edge bundle free of node-only libs.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|auth).*)"],
};
