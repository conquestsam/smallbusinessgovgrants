// System settings API endpoints
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { systemSettings } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

// NEW: Get all system settings
export async function GET() {
  try {
    const settings = await db.select().from(systemSettings);
    
    // Convert array to object for easier frontend consumption
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.key] = {
        value: setting.value,
        description: setting.description,
        updatedAt: setting.updatedAt,
        updatedBy: setting.updatedBy
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
    const { settings, updatedBy } = body; // Add updatedBy to track who made the change

    // Update each setting
    const updatePromises = Object.entries(settings).map(async ([key, data]: [string, any]) => {
      return db
        .insert(systemSettings)
        .values({
          key,
          value: data.value,
          description: data.description || '',
          updatedBy: updatedBy || null, // Use provided updatedBy or null
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: {
            value: data.value,
            description: data.description || '',
            updatedBy: updatedBy || null,
            updatedAt: new Date(),
          },
        });
    });

    await Promise.all(updatePromises);

    return NextResponse.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// NEW: Get a specific setting by key
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key } = body;

    if (!key) {
      return NextResponse.json({ error: 'Setting key is required' }, { status: 400 });
    }

    const setting = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);

    if (setting.length === 0) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
    }

    return NextResponse.json(setting[0]);
  } catch (error) {
    console.error('Error fetching setting:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}