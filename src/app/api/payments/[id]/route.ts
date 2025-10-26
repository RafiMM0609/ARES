// src/app/api/payments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
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

    const supabase = getServiceSupabase();

    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        *,
        payer:users!payer_id(id, full_name, email),
        payee:users!payee_id(id, full_name, email),
        invoice:invoices(id, invoice_number, amount, description)
      `)
      .eq('id', id)
      .single();

    if (error || !payment) {
      return NextResponse.json({ error: error?.message || 'Payment not found' }, { status: 400 });
    }

    // Check if user has access to this payment
    if (payment.payer_id !== user.userId && payment.payee_id !== user.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

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

    const supabase = getServiceSupabase();

    // Check if user has permission to update
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('payer_id, payee_id, invoice_id')
      .eq('id', id)
      .single();

    if (!existingPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Only payer can update payment
    if (existingPayment.payer_id !== user.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const updateData: {
      status: string;
      transaction_hash?: string;
      notes?: string;
    } = { status };

    if (transaction_hash) {
      updateData.transaction_hash = transaction_hash;
    }

    if (notes) {
      updateData.notes = notes;
    }

    const { data: payment, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        payer:users!payer_id(id, full_name, email),
        payee:users!payee_id(id, full_name, email)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // If payment is completed, update invoice status
    if (status === 'completed') {
      await supabase
        .from('invoices')
        .update({ 
          status: 'paid',
          paid_date: new Date().toISOString(),
        })
        .eq('id', existingPayment.invoice_id);
    }

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
