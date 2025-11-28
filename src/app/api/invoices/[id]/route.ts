// src/app/api/invoices/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, getCurrentTimestamp, InvoiceRow, UserRow, ProjectRow, PaymentRow } from '@/lib/sqlite';
import { getUserFromRequest } from '@/lib/auth';

interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
}

interface InvoiceWithRelations extends InvoiceRow {
  client?: Pick<UserRow, 'id' | 'full_name' | 'email' | 'country'> | null;
  freelancer?: Pick<UserRow, 'id' | 'full_name' | 'email' | 'country'> | null;
  project?: Pick<ProjectRow, 'id' | 'title'> | null;
  items?: InvoiceItem[];
  payments?: PaymentRow[];
}

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

    const db = getDatabase();

    const row = db.prepare(`
      SELECT i.*,
        c.id as client_id_ref, c.full_name as client_full_name, c.email as client_email, c.country as client_country,
        f.id as freelancer_id_ref, f.full_name as freelancer_full_name, f.email as freelancer_email, f.country as freelancer_country,
        p.id as project_id_ref, p.title as project_title
      FROM invoices i
      LEFT JOIN users c ON i.client_id = c.id
      LEFT JOIN users f ON i.freelancer_id = f.id
      LEFT JOIN projects p ON i.project_id = p.id
      WHERE i.id = ?
    `).get(id) as (InvoiceRow & {
      client_id_ref: string;
      client_full_name: string | null;
      client_email: string;
      client_country: string | null;
      freelancer_id_ref: string;
      freelancer_full_name: string | null;
      freelancer_email: string;
      freelancer_country: string | null;
      project_id_ref: string | null;
      project_title: string | null;
    }) | undefined;

    if (!row) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Check if user has access to this invoice
    if (row.client_id !== user.userId && row.freelancer_id !== user.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get items and payments
    const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(id) as InvoiceItem[];
    const payments = db.prepare('SELECT * FROM payments WHERE invoice_id = ?').all(id) as PaymentRow[];

    const invoice: InvoiceWithRelations = {
      id: row.id,
      invoice_number: row.invoice_number,
      project_id: row.project_id,
      client_id: row.client_id,
      freelancer_id: row.freelancer_id,
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      issue_date: row.issue_date,
      due_date: row.due_date,
      paid_date: row.paid_date,
      description: row.description,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      client: {
        id: row.client_id_ref,
        full_name: row.client_full_name,
        email: row.client_email,
        country: row.client_country,
      },
      freelancer: {
        id: row.freelancer_id_ref,
        full_name: row.freelancer_full_name,
        email: row.freelancer_email,
        country: row.freelancer_country,
      },
      project: row.project_id_ref ? {
        id: row.project_id_ref,
        title: row.project_title!,
      } : null,
      items,
      payments,
    };

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

    const db = getDatabase();

    // Check if user has permission to update
    const existingInvoice = db.prepare(`
      SELECT freelancer_id, client_id, status FROM invoices WHERE id = ?
    `).get(id) as Pick<InvoiceRow, 'freelancer_id' | 'client_id' | 'status'> | undefined;

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Freelancer can only update draft invoices
    if (existingInvoice.freelancer_id === user.userId && existingInvoice.status !== 'draft') {
      return NextResponse.json({ 
        error: 'Can only update draft invoices' 
      }, { status: 403 });
    }

    const now = getCurrentTimestamp();

    // Client can update status (e.g., mark as paid)
    if (existingInvoice.client_id === user.userId) {
      db.prepare(`
        UPDATE invoices SET status = ?, updated_at = ? WHERE id = ?
      `).run(status, now, id);
    } else if (existingInvoice.freelancer_id === user.userId) {
      // Freelancer updates invoice details
      db.prepare(`
        UPDATE invoices SET
          amount = COALESCE(?, amount),
          due_date = COALESCE(?, due_date),
          description = COALESCE(?, description),
          notes = COALESCE(?, notes),
          status = COALESCE(?, status),
          updated_at = ?
        WHERE id = ?
      `).run(amount, due_date, description, notes, status, now, id);
    } else {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch updated invoice
    const row = db.prepare(`
      SELECT i.*,
        c.id as client_id_ref, c.full_name as client_full_name, c.email as client_email,
        f.id as freelancer_id_ref, f.full_name as freelancer_full_name, f.email as freelancer_email
      FROM invoices i
      LEFT JOIN users c ON i.client_id = c.id
      LEFT JOIN users f ON i.freelancer_id = f.id
      WHERE i.id = ?
    `).get(id) as InvoiceRow & {
      client_id_ref: string;
      client_full_name: string | null;
      client_email: string;
      freelancer_id_ref: string;
      freelancer_full_name: string | null;
      freelancer_email: string;
    };

    const invoice = {
      ...row,
      client: {
        id: row.client_id_ref,
        full_name: row.client_full_name,
        email: row.client_email,
      },
      freelancer: {
        id: row.freelancer_id_ref,
        full_name: row.freelancer_full_name,
        email: row.freelancer_email,
      },
    };

    return NextResponse.json({ 
      message: 'Invoice updated successfully',
      invoice 
    });
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

    const db = getDatabase();

    // Check if user is the freelancer who created the invoice
    const existingInvoice = db.prepare(`
      SELECT freelancer_id, status FROM invoices WHERE id = ?
    `).get(id) as Pick<InvoiceRow, 'freelancer_id' | 'status'> | undefined;

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

    db.prepare('DELETE FROM invoices WHERE id = ?').run(id);

    return NextResponse.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Invoice deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
