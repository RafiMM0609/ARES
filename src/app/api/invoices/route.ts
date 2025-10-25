// src/app/api/invoices/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceSupabase } from '@/lib/supabase';

// Get all invoices (filtered by user)
export async function GET(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('invoices')
      .select(`
        *,
        client:profiles!client_id(id, full_name, email),
        freelancer:profiles!freelancer_id(id, full_name, email),
        project:projects(id, title),
        items:invoice_items(*)
      `)
      .or(`client_id.eq.${user.id},freelancer_id.eq.${user.id}`);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const { data: invoices, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('Invoices fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new invoice
export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { project_id, client_id, amount, currency, due_date, description, notes, items } = body;

    if (!client_id || !amount) {
      return NextResponse.json(
        { error: 'Client and amount are required' },
        { status: 400 }
      );
    }

    // Generate invoice number using Supabase function
    const serviceSupabase = getServiceSupabase();
    const { data: invoiceNumberData, error: invoiceNumberError } = await serviceSupabase
      .rpc('generate_invoice_number');

    if (invoiceNumberError) {
      console.error('Invoice number generation error:', invoiceNumberError);
      return NextResponse.json({ error: 'Failed to generate invoice number' }, { status: 500 });
    }

    // Create invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      // @ts-expect-error - Supabase complex insert types
      .insert({
        invoice_number: invoiceNumberData,
        project_id,
        client_id,
        freelancer_id: user.id,
        amount,
        currency: currency || 'USD',
        due_date,
        description,
        notes,
        status: 'draft',
      })
      .select(`
        *,
        client:profiles!client_id(id, full_name, email),
        freelancer:profiles!freelancer_id(id, full_name, email),
        project:projects(id, title)
      `)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: error?.message || 'Failed to create invoice' }, { status: 400 });
    }

    // Create invoice items if provided
    if (items && items.length > 0) {
      const invoiceItems = items.map((item: { description: string; quantity: number; unit_price: number }) => ({
        // @ts-expect-error - invoice type after null check
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity || 1,
        unit_price: item.unit_price,
        total: (item.quantity || 1) * item.unit_price,
      }));

      await supabase
        .from('invoice_items')
        .insert(invoiceItems);
    }

    return NextResponse.json({ 
      message: 'Invoice created successfully',
      invoice 
    }, { status: 201 });
  } catch (error) {
    console.error('Invoice creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
