// src/app/api/invoices/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma, generateUUID, generateInvoiceNumber } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

// Get all invoices (filtered by user)
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const whereClause: Record<string, unknown> = {
      OR: [
        { clientId: user.userId },
        { freelancerId: user.userId },
      ],
    };

    if (status) {
      whereClause.status = status;
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        freelancer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            walletAddress: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to snake_case for API compatibility
    return NextResponse.json({
      invoices: invoices.map(invoice => ({
        id: invoice.id,
        invoice_number: invoice.invoiceNumber,
        project_id: invoice.projectId,
        client_id: invoice.clientId,
        freelancer_id: invoice.freelancerId,
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status,
        issue_date: invoice.issueDate.toISOString(),
        due_date: invoice.dueDate?.toISOString() || null,
        paid_date: invoice.paidDate?.toISOString() || null,
        description: invoice.description,
        notes: invoice.notes,
        created_at: invoice.createdAt.toISOString(),
        updated_at: invoice.updatedAt.toISOString(),
        client: {
          id: invoice.client.id,
          full_name: invoice.client.fullName,
          email: invoice.client.email,
        },
        freelancer: {
          id: invoice.freelancer.id,
          full_name: invoice.freelancer.fullName,
          email: invoice.freelancer.email,
          wallet_address: invoice.freelancer.walletAddress,
        },
        project: invoice.project ? {
          id: invoice.project.id,
          title: invoice.project.title,
        } : null,
        items: invoice.items.map(item => ({
          id: item.id,
          invoice_id: item.invoiceId,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total: item.total,
          created_at: item.createdAt.toISOString(),
        })),
      })),
    });
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

    const invoiceId = generateUUID();
    const invoiceNumber = await generateInvoiceNumber();

    // Create invoice with items in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.invoice.create({
        data: {
          id: invoiceId,
          invoiceNumber,
          projectId: project_id || null,
          clientId: client_id,
          freelancerId: user.userId,
          amount,
          currency: currency || 'USD',
          dueDate: due_date ? new Date(due_date) : null,
          description: description || null,
          notes: notes || null,
          status: 'draft',
        },
      });

      // Create invoice items if provided
      if (items && items.length > 0) {
        for (const item of items) {
          const quantity = item.quantity || 1;
          const total = quantity * item.unit_price;
          await tx.invoiceItem.create({
            data: {
              id: generateUUID(),
              invoiceId,
              description: item.description,
              quantity,
              unitPrice: item.unit_price,
              total,
            },
          });
        }
      }
    });

    // Fetch created invoice with relations
    const fullInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        freelancer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        items: true,
      },
    });

    if (!fullInvoice) {
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }

    // Transform to snake_case for API compatibility
    return NextResponse.json({
      message: 'Invoice created successfully',
      invoice: {
        id: fullInvoice.id,
        invoice_number: fullInvoice.invoiceNumber,
        project_id: fullInvoice.projectId,
        client_id: fullInvoice.clientId,
        freelancer_id: fullInvoice.freelancerId,
        amount: fullInvoice.amount,
        currency: fullInvoice.currency,
        status: fullInvoice.status,
        issue_date: fullInvoice.issueDate.toISOString(),
        due_date: fullInvoice.dueDate?.toISOString() || null,
        paid_date: fullInvoice.paidDate?.toISOString() || null,
        description: fullInvoice.description,
        notes: fullInvoice.notes,
        created_at: fullInvoice.createdAt.toISOString(),
        updated_at: fullInvoice.updatedAt.toISOString(),
        client: {
          id: fullInvoice.client.id,
          full_name: fullInvoice.client.fullName,
          email: fullInvoice.client.email,
        },
        freelancer: {
          id: fullInvoice.freelancer.id,
          full_name: fullInvoice.freelancer.fullName,
          email: fullInvoice.freelancer.email,
        },
        project: fullInvoice.project ? {
          id: fullInvoice.project.id,
          title: fullInvoice.project.title,
        } : null,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Invoice creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
