// src/app/api/invoices/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Get a single invoice
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

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:profiles!client_id(id, full_name, email, country),
        freelancer:profiles!freelancer_id(id, full_name, email, country),
        project:projects(id, title),
        items:invoice_items(*),
        payments:payments(*)
      `)
      .eq('id', id)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: error?.message || 'Invoice not found' }, { status: 400 });
    }

    // Check if user has access to this invoice
    // @ts-expect-error - Supabase types are complex with joins
    if (invoice.client_id !== user.id && invoice.freelancer_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error('Invoice fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update an invoice
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
    const { status, amount, due_date, description, notes } = body;

    // Check if user has permission to update
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('freelancer_id, client_id, status')
      .eq('id', id)
      .single();

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // @ts-expect-error - Supabase types with select
    // Freelancer can only update draft invoices
    if (existingInvoice.freelancer_id === user.id && existingInvoice.status !== 'draft') {
      return NextResponse.json({ 
        error: 'Can only update draft invoices' 
      }, { status: 403 });
    }

    // @ts-expect-error - Supabase types with select
    // Client can update status (e.g., mark as paid)
    if (existingInvoice.client_id === user.id) {
      const { data: invoice, error } = await supabase
        .from('invoices')
        // @ts-expect-error - complex types
        .update({ status })
        .eq('id', id)
        .select(`
          *,
          client:profiles!client_id(id, full_name, email),
          freelancer:profiles!freelancer_id(id, full_name, email)
        `)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ 
        message: 'Invoice updated successfully',
        invoice 
      });
    }

    // @ts-expect-error - Supabase types with select
    // Freelancer updates invoice details
    if (existingInvoice.freelancer_id === user.id) {
      const { data: invoice, error } = await supabase
        .from('invoices')
        // @ts-expect-error - complex types
        .update({
          amount,
          due_date,
          description,
          notes,
          status,
        })
        .eq('id', id)
        .select(`
          *,
          client:profiles!client_id(id, full_name, email),
          freelancer:profiles!freelancer_id(id, full_name, email)
        `)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ 
        message: 'Invoice updated successfully',
        invoice 
      });
    }

    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  } catch (error) {
    console.error('Invoice update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete an invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is the freelancer who created the invoice
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('freelancer_id, status')
      .eq('id', id)
      .single();

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // @ts-expect-error - Supabase types with select
    if (existingInvoice.freelancer_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // @ts-expect-error - Supabase types with select
    // Only allow deleting draft invoices
    if (existingInvoice.status !== 'draft') {
      return NextResponse.json({ 
        error: 'Can only delete draft invoices' 
      }, { status: 403 });
    }

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Invoice deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
