// src/app/api/payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
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

    const supabase = getServiceSupabase();

    let query = supabase
      .from('payments')
      .select(`
        *,
        payer:users!payer_id(id, full_name, email),
        payee:users!payee_id(id, full_name, email),
        invoice:invoices(id, invoice_number, amount)
      `)
      .or(`payer_id.eq.${user.userId},payee_id.eq.${user.userId}`);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const { data: payments, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

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

    const supabase = getServiceSupabase();

    // Verify the invoice exists and user is the client
    const { data: invoice } = await supabase
      .from('invoices')
      .select('client_id, freelancer_id, amount')
      .eq('id', invoice_id)
      .single();

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.client_id !== user.userId) {
      return NextResponse.json({ 
        error: 'Only the client can make payment for this invoice' 
      }, { status: 403 });
    }

    // Create payment
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        invoice_id,
        payer_id: user.userId,
        payee_id,
        amount,
        currency: currency || 'USD',
        payment_method: payment_method || 'wallet',
        transaction_hash,
        notes,
        status: 'pending',
      })
      .select(`
        *,
        payer:users!payer_id(id, full_name, email),
        payee:users!payee_id(id, full_name, email),
        invoice:invoices(id, invoice_number)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

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
