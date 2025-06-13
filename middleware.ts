import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Only apply to embed routes
  if (request.nextUrl.pathname.startsWith('/embed/')) {
    const response = NextResponse.next()
    
    // Set X-Frame-Options to allow embedding from any origin
    response.headers.set('X-Frame-Options', 'ALLOWALL')
    
    // Set Content Security Policy to allow embedding from any origin
    response.headers.set('Content-Security-Policy', 'frame-ancestors *')
    
    return response
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/embed/:path*'
}
