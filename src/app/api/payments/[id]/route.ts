// src/app/api/payments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

// Get a single payment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payment = await prisma.payment.findUnique({
      where: { id },
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
            description: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Check if user has access to this payment
    if (payment.payerId !== user.userId && payment.payeeId !== user.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Transform to snake_case for API compatibility
    return NextResponse.json({
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
          amount: payment.invoice.amount,
          description: payment.invoice.description,
        },
      },
    });
  } catch (error) {
    console.error('Payment fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update a payment status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, transaction_hash, notes } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Check if user has permission to update
    const existingPayment = await prisma.payment.findUnique({
      where: { id },
      select: { payerId: true, payeeId: true, invoiceId: true },
    });

    if (!existingPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Only payer can update payment
    if (existingPayment.payerId !== user.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Build update data
    const updateData: Record<string, unknown> = { status };
    if (transaction_hash !== undefined) {
      updateData.transactionHash = transaction_hash;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    await prisma.payment.update({
      where: { id },
      data: updateData,
    });

    // If payment is completed, update invoice status
    if (status === 'completed') {
      await prisma.invoice.update({
        where: { id: existingPayment.invoiceId },
        data: {
          status: 'paid',
          paidDate: new Date(),
        },
      });
    }

    // Fetch updated payment
    const updatedPayment = await prisma.payment.findUnique({
      where: { id },
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
      },
    });

    if (!updatedPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Transform to snake_case for API compatibility
    return NextResponse.json({
      message: 'Payment updated successfully',
      payment: {
        id: updatedPayment.id,
        invoice_id: updatedPayment.invoiceId,
        payer_id: updatedPayment.payerId,
        payee_id: updatedPayment.payeeId,
        amount: updatedPayment.amount,
        currency: updatedPayment.currency,
        payment_method: updatedPayment.paymentMethod,
        transaction_hash: updatedPayment.transactionHash,
        status: updatedPayment.status,
        payment_date: updatedPayment.paymentDate.toISOString(),
        notes: updatedPayment.notes,
        created_at: updatedPayment.createdAt.toISOString(),
        updated_at: updatedPayment.updatedAt.toISOString(),
        payer: {
          id: updatedPayment.payer.id,
          full_name: updatedPayment.payer.fullName,
          email: updatedPayment.payer.email,
        },
        payee: {
          id: updatedPayment.payee.id,
          full_name: updatedPayment.payee.fullName,
          email: updatedPayment.payee.email,
        },
      },
    });
  } catch (error) {
    console.error('Payment update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
