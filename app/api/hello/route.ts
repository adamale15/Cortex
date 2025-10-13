import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    message: 'Hello from Cortex API!',
    timestamp: new Date().toISOString()
  })
}

