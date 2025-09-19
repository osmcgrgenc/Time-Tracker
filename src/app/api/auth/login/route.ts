import { NextResponse } from 'next/server';

// This endpoint is now deprecated in favor of NextAuth.js
// Login should be handled through /api/auth/signin
export async function POST() {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. Please use NextAuth.js signin.',
      redirect: '/api/auth/signin'
    },
    { status: 410 } // Gone
  );
}