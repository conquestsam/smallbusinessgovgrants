// [WHY] Handle receipt file upload for deposits
// [WHAT] Receives a receipt image, uploads to Cloudinary, and updates the deposit record

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { deposits } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { CloudinaryService } from '@/lib/services/cloudinary.service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const receiptFile = formData.get('receipt') as File;
    const depositId = formData.get('depositId') as string;

    // [WHY] Validate both receipt file and deposit ID are present
    if (!receiptFile || !depositId) {
      return NextResponse.json({ message: 'Receipt file and deposit ID are required' }, { status: 400 });
    }

    // [WHY] Check the deposit exists and is still in a valid state for receipt upload
    const [existingDeposit] = await db
      .select()
      .from(deposits)
      .where(eq(deposits.id, depositId))
      .limit(1);

    if (!existingDeposit) {
      return NextResponse.json({ message: 'Deposit not found' }, { status: 404 });
    }

    // [WHY] Only allow receipt upload for pending deposits
    if (existingDeposit.status !== 'pending') {
      return NextResponse.json({ message: 'Deposit is no longer in pending state' }, { status: 400 });
    }

    // [WHAT] Upload receipt to Cloudinary and get secure URL
    const arrayBuffer = await receiptFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // [WHY] Use CloudinaryService to upload the receipt image
    // [WHAT] Store under a deposits folder with deposit ID as identifier
    let receiptUrl: string;
    try {
      const result = await CloudinaryService.uploadDocument(
        buffer,
        `receipt_${depositId}`,
        existingDeposit.userId,
        receiptFile.type
      );
      receiptUrl = result.url;
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      return NextResponse.json({ message: 'Failed to upload receipt' }, { status: 500 });
    }

    // [WHAT] Update deposit with receipt URL and change status to receipt_uploaded
    await db
      .update(deposits)
      .set({
        receiptUrl,
        status: 'receipt_uploaded',
        updatedAt: new Date(),
      })
      .where(eq(deposits.id, depositId));

    return NextResponse.json({
      message: 'Receipt uploaded successfully',
      receiptUrl,
    });
  } catch (error: any) {
    console.error('Receipt upload error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to upload receipt' },
      { status: 500 }
    );
  }
}
