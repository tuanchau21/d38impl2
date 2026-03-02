import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale, isLocale } from "@/lib/i18n";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (!firstSegment) {
    return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url));
  }

  if (isLocale(firstSegment)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL(`/${defaultLocale}${pathname}`, request.url));
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
