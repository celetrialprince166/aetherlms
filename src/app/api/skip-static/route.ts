import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

// This route helps identify pages that should skip static generation
export async function GET() {
  // Force dynamic rendering
  headers()
  
  return NextResponse.json({
    skipStatic: true,
    timestamp: Date.now()
  })
}

// Force dynamic runtime for this route
export const dynamic = 'force-dynamic' 