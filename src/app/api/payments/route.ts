// src/app/api/payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, generateUUID, getCurrentTimestamp, PaymentRow, UserRow, InvoiceRow } from '@/lib/sqlite';
import { getUserFromRequest } from '@/lib/auth';

interface PaymentWithRelations extends PaymentRow {
  payer?: Pick<UserRow, 'id' | 'full_name' | 'email'> | null;
  payee?: Pick<UserRow, 'id' | 'full_name' | 'email'> | null;
  invoice?: Pick<InvoiceRow, 'id' | 'invoice_number' | 'amount'> | null;
}

// Get all payments (filtered by user)
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const db = getDatabase();

    let query = `
      SELECT p.*,
        payer.id as payer_id_ref, payer.full_name as payer_full_name, payer.email as payer_email,
        payee.id as payee_id_ref, payee.full_name as payee_full_name, payee.email as payee_email,
        i.id as invoice_id_ref, i.invoice_number, i.amount as invoice_amount
      FROM payments p
      LEFT JOIN users payer ON p.payer_id = payer.id
      LEFT JOIN users payee ON p.payee_id = payee.id
      LEFT JOIN invoices i ON p.invoice_id = i.id
      WHERE (p.payer_id = ? OR p.payee_id = ?)
    `;
    const params: string[] = [user.userId, user.userId];

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    query += ' ORDER BY p.created_at DESC';

    const rows = db.prepare(query).all(...params) as Array<PaymentRow & {
      payer_id_ref: string;
      payer_full_name: string | null;
      payer_email: string;
      payee_id_ref: string;
      payee_full_name: string | null;
      payee_email: string;
      invoice_id_ref: string;
      invoice_number: string;
      invoice_amount: number;
    }>;

    const payments: PaymentWithRelations[] = rows.map(row => ({
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
      },
    }));

    return NextResponse.json({ payments });
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

    const db = getDatabase();

    // Verify the invoice exists and user is the client
    const invoice = db.prepare(`
      SELECT client_id, freelancer_id, amount FROM invoices WHERE id = ?
    `).get(invoice_id) as Pick<InvoiceRow, 'client_id' | 'freelancer_id' | 'amount'> | undefined;

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.client_id !== user.userId) {
      return NextResponse.json({ 
        error: 'Only the client can make payment for this invoice' 
      }, { status: 403 });
    }

    const paymentId = generateUUID();
    const now = getCurrentTimestamp();

    // Create payment
    db.prepare(`
      INSERT INTO payments (id, invoice_id, payer_id, payee_id, amount, currency, payment_method, transaction_hash, notes, status, payment_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
    `).run(
      paymentId,
      invoice_id,
      user.userId,
      payee_id,
      amount,
      currency || 'USD',
      payment_method || 'wallet',
      transaction_hash || null,
      notes || null,
      now,
      now,
      now
    );

    // Fetch created payment with relations
    const row = db.prepare(`
      SELECT p.*,
        payer.id as payer_id_ref, payer.full_name as payer_full_name, payer.email as payer_email,
        payee.id as payee_id_ref, payee.full_name as payee_full_name, payee.email as payee_email,
        i.id as invoice_id_ref, i.invoice_number
      FROM payments p
      LEFT JOIN users payer ON p.payer_id = payer.id
      LEFT JOIN users payee ON p.payee_id = payee.id
      LEFT JOIN invoices i ON p.invoice_id = i.id
      WHERE p.id = ?
    `).get(paymentId) as PaymentRow & {
      payer_id_ref: string;
      payer_full_name: string | null;
      payer_email: string;
      payee_id_ref: string;
      payee_full_name: string | null;
      payee_email: string;
      invoice_id_ref: string;
      invoice_number: string;
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
      invoice: {
        id: row.invoice_id_ref,
        invoice_number: row.invoice_number,
      },
    };

    return NextResponse.json({ 
      message: 'Payment created successfully',
      payment 
    }, { status: 201 });
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
