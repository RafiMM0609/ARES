// src/app/api/payments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, getCurrentTimestamp, PaymentRow, UserRow, InvoiceRow } from '@/lib/sqlite';
import { getUserFromRequest } from '@/lib/auth';

interface PaymentWithRelations extends PaymentRow {
  payer?: Pick<UserRow, 'id' | 'full_name' | 'email'> | null;
  payee?: Pick<UserRow, 'id' | 'full_name' | 'email'> | null;
  invoice?: Pick<InvoiceRow, 'id' | 'invoice_number' | 'amount' | 'description'> | null;
}

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

    const db = getDatabase();

    const row = db.prepare(`
      SELECT p.*,
        payer.id as payer_id_ref, payer.full_name as payer_full_name, payer.email as payer_email,
        payee.id as payee_id_ref, payee.full_name as payee_full_name, payee.email as payee_email,
        i.id as invoice_id_ref, i.invoice_number, i.amount as invoice_amount, i.description as invoice_description
      FROM payments p
      LEFT JOIN users payer ON p.payer_id = payer.id
      LEFT JOIN users payee ON p.payee_id = payee.id
      LEFT JOIN invoices i ON p.invoice_id = i.id
      WHERE p.id = ?
    `).get(id) as (PaymentRow & {
      payer_id_ref: string;
      payer_full_name: string | null;
      payer_email: string;
      payee_id_ref: string;
      payee_full_name: string | null;
      payee_email: string;
      invoice_id_ref: string;
      invoice_number: string;
      invoice_amount: number;
      invoice_description: string | null;
    }) | undefined;

    if (!row) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Check if user has access to this payment
    if (row.payer_id !== user.userId && row.payee_id !== user.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const payment: PaymentWithRelations = {
      id: row.id,
      invoice_id: row.invoice_id,
      payer_id: row.payer_id,
      payee_id: row.payee_id,
      amount: row.amount,
      currency: row.currency,
      payment_method: row.payment_method,
      transaction_hash: row.transaction_hash,
      status: row.status,
      payment_date: row.payment_date,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      payer: {
        id: row.payer_id_ref,
        full_name: row.payer_full_name,
        email: row.payer_email,
      },
      payee: {
        id: row.payee_id_ref,
        full_name: row.payee_full_name,
        email: row.payee_email,
      },
      invoice: {
        id: row.invoice_id_ref,
        invoice_number: row.invoice_number,
        amount: row.invoice_amount,
        description: row.invoice_description,
      },
    };

    return NextResponse.json({ payment });
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

    const db = getDatabase();

    // Check if user has permission to update
    const existingPayment = db.prepare(`
      SELECT payer_id, payee_id, invoice_id FROM payments WHERE id = ?
    `).get(id) as Pick<PaymentRow, 'payer_id' | 'payee_id' | 'invoice_id'> | undefined;

    if (!existingPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Only payer can update payment
    if (existingPayment.payer_id !== user.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const now = getCurrentTimestamp();

    // Build update query
    const updates: string[] = ['status = ?', 'updated_at = ?'];
    const values: (string | null)[] = [status, now];

    if (transaction_hash !== undefined) {
      updates.push('transaction_hash = ?');
      values.push(transaction_hash);
    }

    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes);
    }

    values.push(id);

    db.prepare(`UPDATE payments SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    // If payment is completed, update invoice status
    if (status === 'completed') {
      db.prepare(`
        UPDATE invoices SET status = 'paid', paid_date = ? WHERE id = ?
      `).run(now, existingPayment.invoice_id);
    }

    // Fetch updated payment
    const row = db.prepare(`
      SELECT p.*,
        payer.id as payer_id_ref, payer.full_name as payer_full_name, payer.email as payer_email,
        payee.id as payee_id_ref, payee.full_name as payee_full_name, payee.email as payee_email
      FROM payments p
      LEFT JOIN users payer ON p.payer_id = payer.id
      LEFT JOIN users payee ON p.payee_id = payee.id
      WHERE p.id = ?
    `).get(id) as PaymentRow & {
      payer_id_ref: string;
      payer_full_name: string | null;
      payer_email: string;
      payee_id_ref: string;
      payee_full_name: string | null;
      payee_email: string;
    };

    const payment = {
      ...row,
      payer: {
        id: row.payer_id_ref,
        full_name: row.payer_full_name,
        email: row.payer_email,
      },
      payee: {
        id: row.payee_id_ref,
        full_name: row.payee_full_name,
        email: row.payee_email,
      },
    };

    return NextResponse.json({ 
      message: 'Payment updated successfully',
      payment 
    });
  } catch (error) {
    console.error('Payment update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
