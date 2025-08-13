import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const url = req.nextUrl.clone();

  if (url.pathname.startsWith('/admin')) {

    if (!token || token.email !== 'subletify@wustl.edu') {
      url.pathname = 'redirects/403';
      return NextResponse.rewrite(url); 
    }

  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'], 
};
