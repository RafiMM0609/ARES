// src/app/api/payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma, generateUUID } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

// Get all payments (filtered by user)
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const whereClause: Record<string, unknown> = {
      OR: [
        { payerId: user.userId },
        { payeeId: user.userId },
      ],
    };

    if (status) {
      whereClause.status = status;
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        payer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        payee: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            amount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to snake_case for API compatibility
    return NextResponse.json({
      payments: payments.map(payment => ({
        id: payment.id,
        invoice_id: payment.invoiceId,
        payer_id: payment.payerId,
        payee_id: payment.payeeId,
        amount: payment.amount,
        currency: payment.currency,
        payment_method: payment.paymentMethod,
        transaction_hash: payment.transactionHash,
        status: payment.status,
        payment_date: payment.paymentDate.toISOString(),
        notes: payment.notes,
        created_at: payment.createdAt.toISOString(),
        updated_at: payment.updatedAt.toISOString(),
        payer: {
          id: payment.payer.id,
          full_name: payment.payer.fullName,
          email: payment.payer.email,
        },
        payee: {
          id: payment.payee.id,
          full_name: payment.payee.fullName,
          email: payment.payee.email,
        },
        invoice: {
          id: payment.invoice.id,
          invoice_number: payment.invoice.invoiceNumber,
          amount: payment.invoice.amount,
        },
      })),
    });
  } catch (error) {
    console.error('Payments fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new payment
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { invoice_id, payee_id, amount, currency, payment_method, transaction_hash, notes } = body;

    if (!invoice_id || !payee_id || !amount) {
      return NextResponse.json(
        { error: 'Invoice, payee, and amount are required' },
        { status: 400 }
      );
    }

    // Verify the invoice exists and user is the client
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoice_id },
      select: { clientId: true, freelancerId: true, amount: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.clientId !== user.userId) {
      return NextResponse.json({
        error: 'Only the client can make payment for this invoice'
      }, { status: 403 });
    }

    const paymentId = generateUUID();

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        id: paymentId,
        invoiceId: invoice_id,
        payerId: user.userId,
        payeeId: payee_id,
        amount,
        currency: currency || 'USD',
        paymentMethod: payment_method || 'wallet',
        transactionHash: transaction_hash || null,
        notes: notes || null,
        status: 'pending',
      },
      include: {
        payer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        payee: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
          },
        },
      },
    });

    // Transform to snake_case for API compatibility
    return NextResponse.json({
      message: 'Payment created successfully',
      payment: {
        id: payment.id,
        invoice_id: payment.invoiceId,
        payer_id: payment.payerId,
        payee_id: payment.payeeId,
        amount: payment.amount,
        currency: payment.currency,
        payment_method: payment.paymentMethod,
        transaction_hash: payment.transactionHash,
        status: payment.status,
        payment_date: payment.paymentDate.toISOString(),
        notes: payment.notes,
        created_at: payment.createdAt.toISOString(),
        updated_at: payment.updatedAt.toISOString(),
        payer: {
          id: payment.payer.id,
          full_name: payment.payer.fullName,
          email: payment.payer.email,
        },
        payee: {
          id: payment.payee.id,
          full_name: payment.payee.fullName,
          email: payment.payee.email,
        },
        invoice: {
          id: payment.invoice.id,
          invoice_number: payment.invoice.invoiceNumber,
        },
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
