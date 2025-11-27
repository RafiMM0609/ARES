// src/app/api/invoices/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, generateUUID, getCurrentTimestamp, generateInvoiceNumber, InvoiceRow, UserRow, ProjectRow } from '@/lib/sqlite';
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
  client?: Pick<UserRow, 'id' | 'full_name' | 'email'> | null;
  freelancer?: Pick<UserRow, 'id' | 'full_name' | 'email'> | null;
  project?: Pick<ProjectRow, 'id' | 'title'> | null;
  items?: InvoiceItem[];
}

// Get all invoices (filtered by user)
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
      SELECT i.*,
        c.id as client_id_ref, c.full_name as client_full_name, c.email as client_email,
        f.id as freelancer_id_ref, f.full_name as freelancer_full_name, f.email as freelancer_email,
        p.id as project_id_ref, p.title as project_title
      FROM invoices i
      LEFT JOIN users c ON i.client_id = c.id
      LEFT JOIN users f ON i.freelancer_id = f.id
      LEFT JOIN projects p ON i.project_id = p.id
      WHERE (i.client_id = ? OR i.freelancer_id = ?)
    `;
    const params: string[] = [user.userId, user.userId];

    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }

    query += ' ORDER BY i.created_at DESC';

    const rows = db.prepare(query).all(...params) as Array<InvoiceRow & {
      client_id_ref: string;
      client_full_name: string | null;
      client_email: string;
      freelancer_id_ref: string;
      freelancer_full_name: string | null;
      freelancer_email: string;
      project_id_ref: string | null;
      project_title: string | null;
    }>;

    // Get items for each invoice
    const invoices: InvoiceWithRelations[] = rows.map(row => {
      const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(row.id) as InvoiceItem[];
      
      return {
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
        },
        freelancer: {
          id: row.freelancer_id_ref,
          full_name: row.freelancer_full_name,
          email: row.freelancer_email,
        },
        project: row.project_id_ref ? {
          id: row.project_id_ref,
          title: row.project_title!,
        } : null,
        items,
      };
    });

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
    const user = getUserFromRequest(request);

    if (!user) {
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

    const db = getDatabase();
    const invoiceId = generateUUID();
    const invoiceNumber = generateInvoiceNumber();
    const now = getCurrentTimestamp();

    // Create invoice
    db.prepare(`
      INSERT INTO invoices (id, invoice_number, project_id, client_id, freelancer_id, amount, currency, due_date, description, notes, status, issue_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?)
    `).run(
      invoiceId,
      invoiceNumber,
      project_id || null,
      client_id,
      user.userId,
      amount,
      currency || 'USD',
      due_date || null,
      description || null,
      notes || null,
      now,
      now,
      now
    );

    // Create invoice items if provided
    if (items && items.length > 0) {
      const insertItem = db.prepare(`
        INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, total, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        const itemId = generateUUID();
        const quantity = item.quantity || 1;
        const total = quantity * item.unit_price;
        insertItem.run(itemId, invoiceId, item.description, quantity, item.unit_price, total, now);
      }
    }

    // Fetch created invoice with relations
    const row = db.prepare(`
      SELECT i.*,
        c.id as client_id_ref, c.full_name as client_full_name, c.email as client_email,
        f.id as freelancer_id_ref, f.full_name as freelancer_full_name, f.email as freelancer_email,
        p.id as project_id_ref, p.title as project_title
      FROM invoices i
      LEFT JOIN users c ON i.client_id = c.id
      LEFT JOIN users f ON i.freelancer_id = f.id
      LEFT JOIN projects p ON i.project_id = p.id
      WHERE i.id = ?
    `).get(invoiceId) as InvoiceRow & {
      client_id_ref: string;
      client_full_name: string | null;
      client_email: string;
      freelancer_id_ref: string;
      freelancer_full_name: string | null;
      freelancer_email: string;
      project_id_ref: string | null;
      project_title: string | null;
    };

    const invoice: InvoiceWithRelations = {
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
      project: row.project_id_ref ? {
        id: row.project_id_ref,
        title: row.project_title!,
      } : null,
    };

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
