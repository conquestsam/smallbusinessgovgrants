// NEW FILE: System settings API endpoints
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { systemSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// NEW: Get all system settings
export async function GET() {
  try {
    const settings = await db.select().from(systemSettings);
    
    // Convert array to object for easier frontend consumption
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.key] = {
        value: setting.value,
        type: setting.type,
        description: setting.description,
        updatedAt: setting.updatedAt
      };
      return acc;
    }, {} as any);

    return NextResponse.json(settingsObject);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// NEW: Update system settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body;

    // Update each setting
    for (const [key, data] of Object.entries(settings as any)) {
      await db
        .insert(systemSettings)
        .values({
          key,
          value: data.value,
          type: data.type || 'string',
          description: data.description || '',
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: {
            value: data.value,
            updatedAt: new Date(),
          },
        });
    }

    return NextResponse.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}