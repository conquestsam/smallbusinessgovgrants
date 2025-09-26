// app/api/visitor/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { TelegramService } from '@/lib/services/telegram.service';

export async function POST(request: NextRequest) {
  console.log('📡 Visitor API route called');
  
  try {
    const body = await request.json();
    console.log('📦 Request body:', body);

    const { userAgent, pageUrl, referrer, language, platform } = body;

    // Get IP address from request headers
    const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                request.ip || 
                'Unknown';

    console.log('🔍 IP detected:', ip);

    const visitorData = {
      ip,
      userAgent: userAgent || 'Unknown',
      timestamp: new Date().toISOString(),
      pageUrl: pageUrl || 'Unknown',
      referrer: referrer || 'Direct',
      language: language || 'Unknown',
      platform: platform || 'Unknown',
    };

    console.log('👤 Visitor data:', visitorData);

    // Send Telegram notification
    const message = `🚀 New Website Visitor\n\n` +
      `🕒 Time: ${new Date().toLocaleString()}\n` +
      `🌐 Page: ${visitorData.pageUrl}\n` +
      `📱 Referrer: ${visitorData.referrer}\n` +
      `🔍 IP: ${visitorData.ip}\n` +
      `🌍 Language: ${visitorData.language}\n` +
      `💻 Platform: ${visitorData.platform}\n` +
      `🖥️ User Agent: ${visitorData.userAgent?.substring(0, 100)}...`;

    console.log('📤 Sending Telegram message...');
    await TelegramService.sendVisitorNotification(message);
    console.log('✅ Telegram message sent successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'Visitor data processed successfully' 
    });

  } catch (error) {
    console.error('❌ Error processing visitor data:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Add OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}