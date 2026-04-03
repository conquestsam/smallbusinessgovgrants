// [WHY] Generate an actual PDF receipt for a transaction (not HTML-to-print)
// [WHAT] Uses jspdf for server-side PDF generation and returns application/pdf content type
// [HOW] Accepts transactionId as path param, looks up the transaction, renders a branded PDF

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { deposits, withdrawals, paymentTransactions, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transactionId = params.id;

    if (!transactionId) {
      return NextResponse.json({ message: 'Transaction ID required' }, { status: 400 });
    }

    // [WHY] Try to find the transaction in all three tables
    let transaction: any = null;
    let transactionType = '';
    let userData: any = null;

    // Check deposits first
    const [depositResult] = await db.select().from(deposits).where(eq(deposits.id, transactionId)).limit(1);
    if (depositResult) {
      transaction = depositResult;
      transactionType = 'Deposit';
      const [user] = await db.select().from(users).where(eq(users.id, depositResult.userId)).limit(1);
      userData = user;
    }

    // Check withdrawals
    if (!transaction) {
      const [withdrawalResult] = await db.select().from(withdrawals).where(eq(withdrawals.id, transactionId)).limit(1);
      if (withdrawalResult) {
        transaction = withdrawalResult;
        transactionType = 'Withdrawal';
        const [user] = await db.select().from(users).where(eq(users.id, withdrawalResult.userId!)).limit(1);
        userData = user;
      }
    }

    // Check payment transactions
    if (!transaction) {
      const [paymentResult] = await db.select().from(paymentTransactions).where(eq(paymentTransactions.id, transactionId)).limit(1);
      if (paymentResult) {
        transaction = paymentResult;
        transactionType = 'Payment';
        const [user] = await db.select().from(users).where(eq(users.id, paymentResult.userId!)).limit(1);
        userData = user;
      }
    }

    if (!transaction) {
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    }

    // [WHY] Dynamically import jspdf to keep it server-side only
    // [RISK] If jspdf is not installed, this will fail — package.json must include it
    const { jsPDF } = await import('jspdf');

    // [WHAT] Create a new PDF document with branding
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // ─── HEADER ────────────────────────────────────────
    doc.setFillColor(0, 46, 109); // SBA Navy
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Small Business Administration', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`${transactionType} Receipt`, pageWidth / 2, 25, { align: 'center' });

    // ─── RECEIPT INFO ──────────────────────────────────
    doc.setTextColor(0, 0, 0);
    let y = 50;

    // Receipt number and date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Receipt Number:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(transaction.id?.slice(0, 16) || 'N/A', 80, y);

    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Date:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(transaction.createdAt || Date.now()).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    }), 80, y);

    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Status:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text((transaction.status || 'N/A').toUpperCase(), 80, y);

    // ─── DIVIDER ───────────────────────────────────────
    y += 12;
    doc.setDrawColor(0, 94, 162);
    doc.setLineWidth(0.5);
    doc.line(20, y, pageWidth - 20, y);

    // ─── AMOUNT ────────────────────────────────────────
    y += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 46, 109);
    doc.text('Transaction Amount', 20, y);

    y += 10;
    doc.setFontSize(24);
    doc.setTextColor(0, 94, 162);
    doc.text(`$${Number(transaction.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 20, y);

    // ─── DETAILS ───────────────────────────────────────
    y += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 46, 109);
    doc.text('Transaction Details', 20, y);

    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    const details: [string, string][] = [
      ['Type', transactionType],
      ['Method', transaction.paymentMethod || transaction.provider || 'N/A'],
    ];

    // [WHY] Add type-specific details
    if (transactionType === 'Withdrawal') {
      details.push(['Bank', transaction.bankName || 'N/A']);
      details.push(['Account', `****${(transaction.accountNumber || '').slice(-4)}`]);
      details.push(['Routing', transaction.routingNumber || 'N/A']);
    }

    if (transaction.withdrawalId) details.push(['Withdrawal ID', transaction.withdrawalId]);
    if (transaction.transactionId) details.push(['Transaction ID', transaction.transactionId]);

    details.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 80, y);
      y += 8;
    });

    // ─── RECIPIENT ─────────────────────────────────────
    if (userData) {
      y += 5;
      doc.setDrawColor(200, 200, 200);
      doc.line(20, y, pageWidth - 20, y);
      y += 10;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 46, 109);
      doc.text('Account Holder', 20, y);

      y += 10;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      doc.setFont('helvetica', 'bold');
      doc.text('Name:', 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`${userData.firstName} ${userData.lastName}`, 80, y);

      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Email:', 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(userData.email, 80, y);
    }

    // ─── FOOTER ────────────────────────────────────────
    const footerY = doc.internal.pageSize.getHeight() - 25;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);

    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.setFont('helvetica', 'normal');
    doc.text('This is an official receipt from the Small Business Administration Grant Program', pageWidth / 2, footerY, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, pageWidth / 2, footerY + 5, { align: 'center' });
    doc.text('For questions, contact SBA Support at support@sba.gov or (800) 827-5722', pageWidth / 2, footerY + 10, { align: 'center' });

    // [WHAT] Convert to buffer and return as PDF response
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-${transactionId.slice(0, 8)}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('PDF receipt generation error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to generate receipt' },
      { status: 500 }
    );
  }
}
