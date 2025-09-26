import { NextRequest, NextResponse } from 'next/server'
import { EmailService } from '@/lib/services/email.service'
import { TelegramService } from '@/lib/services/telegram.service' // Add this import

// Add this export to mark the route as dynamic
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, isSuccess, errorMessage } = body

    if (!name || !email || typeof isSuccess !== 'boolean') {
      return NextResponse.json(
        { error: 'Name, email, and isSuccess status are required' },
        { status: 400 }
      )
    }

    // Send registration email
    await EmailService.sendRegistrationEmail({
      name,
      email,
      isSuccess,
      errorMessage
    })

    // Send Telegram notification for successful registrations
    if (isSuccess) {
      await TelegramService.sendRegistrationNotification(name, email)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Registration email sent successfully' 
    })
  } catch (error) {
    console.error('Error in registration email API:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send registration email', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}