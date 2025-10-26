// src/app/api/invoices/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

// Get a single invoice
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

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:users!client_id(id, full_name, email, country),
        freelancer:users!freelancer_id(id, full_name, email, country),
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
    if (invoice.client_id !== user.userId && invoice.freelancer_id !== user.userId) {
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
    const user = getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, amount, due_date, description, notes } = body;

    const supabase = getServiceSupabase();

    // Check if user has permission to update
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('freelancer_id, client_id, status')
      .eq('id', id)
      .single();

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Freelancer can only update draft invoices
    if (existingInvoice.freelancer_id === user.userId && existingInvoice.status !== 'draft') {
      return NextResponse.json({ 
        error: 'Can only update draft invoices' 
      }, { status: 403 });
    }

    // Client can update status (e.g., mark as paid)
    if (existingInvoice.client_id === user.userId) {
      const { data: invoice, error } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', id)
        .select(`
          *,
          client:users!client_id(id, full_name, email),
          freelancer:users!freelancer_id(id, full_name, email)
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

    // Freelancer updates invoice details
    if (existingInvoice.freelancer_id === user.userId) {
      const { data: invoice, error } = await supabase
        .from('invoices')
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
          client:users!client_id(id, full_name, email),
          freelancer:users!freelancer_id(id, full_name, email)
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
    const user = getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getServiceSupabase();

    // Check if user is the freelancer who created the invoice
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('freelancer_id, status')
      .eq('id', id)
      .single();

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (existingInvoice.freelancer_id !== user.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

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
