// src/app/api/payments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Get a single payment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        *,
        payer:profiles!payer_id(id, full_name, email),
        payee:profiles!payee_id(id, full_name, email),
        invoice:invoices(id, invoice_number, amount, description)
      `)
      .eq('id', id)
      .single();

    if (error || !payment) {
      return NextResponse.json({ error: error?.message || 'Payment not found' }, { status: 400 });
    }

    // @ts-expect-error - Supabase types with select
    // Check if user has access to this payment
    if (payment.payer_id !== user.id && payment.payee_id !== user.id) {
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
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
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('payer_id, payee_id, invoice_id')
      .eq('id', id)
      .single();

    if (!existingPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // @ts-expect-error - Supabase types with select
    // Only payer can update payment
    if (existingPayment.payer_id !== user.id) {
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
      // @ts-expect-error - Supabase update types
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        payer:profiles!payer_id(id, full_name, email),
        payee:profiles!payee_id(id, full_name, email)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // If payment is completed, update invoice status
    if (status === 'completed') {
      await supabase
        .from('invoices')
        // @ts-expect-error - Supabase update types
        .update({ 
          status: 'paid',
          paid_date: new Date().toISOString(),
        })
        // @ts-expect-error - existingPayment type
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
