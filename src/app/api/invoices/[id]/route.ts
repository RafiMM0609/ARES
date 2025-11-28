// src/app/api/invoices/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            email: true,
            country: true,
          },
        },
        freelancer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            country: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        items: true,
        payments: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Check if user has access to this invoice
    if (invoice.clientId !== user.userId && invoice.freelancerId !== user.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Transform to snake_case for API compatibility
    return NextResponse.json({
      invoice: {
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
          country: invoice.client.country,
        },
        freelancer: {
          id: invoice.freelancer.id,
          full_name: invoice.freelancer.fullName,
          email: invoice.freelancer.email,
          country: invoice.freelancer.country,
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
        payments: invoice.payments.map(payment => ({
          id: payment.id,
          invoice_id: payment.invoiceId,
          payer_id: payment.payerId,
          payee_id: payment.payeeId,
          amount: payment.amount,
          currency: payment.currency,
          payment_method: payment.paymentMethod,
          transaction_hash: payment.transactionHash,
          status: payment.status,
          payment_date: payment.paymentDate.toISOString(),
          notes: payment.notes,
          created_at: payment.createdAt.toISOString(),
          updated_at: payment.updatedAt.toISOString(),
        })),
      },
    });
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

    // Check if user has permission to update
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      select: { freelancerId: true, clientId: true, status: true },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Freelancer can only update draft invoices
    if (existingInvoice.freelancerId === user.userId && existingInvoice.status !== 'draft') {
      return NextResponse.json({
        error: 'Can only update draft invoices'
      }, { status: 403 });
    }

    // Client can update status (e.g., mark as paid)
    if (existingInvoice.clientId === user.userId) {
      await prisma.invoice.update({
        where: { id },
        data: { status },
      });
    } else if (existingInvoice.freelancerId === user.userId) {
      // Freelancer updates invoice details
      await prisma.invoice.update({
        where: { id },
        data: {
          amount: amount !== undefined ? amount : undefined,
          dueDate: due_date !== undefined ? (due_date ? new Date(due_date) : null) : undefined,
          description: description !== undefined ? description : undefined,
          notes: notes !== undefined ? notes : undefined,
          status: status !== undefined ? status : undefined,
        },
      });
    } else {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch updated invoice
    const updatedInvoice = await prisma.invoice.findUnique({
      where: { id },
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
      },
    });

    if (!updatedInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Transform to snake_case for API compatibility
    return NextResponse.json({
      message: 'Invoice updated successfully',
      invoice: {
        id: updatedInvoice.id,
        invoice_number: updatedInvoice.invoiceNumber,
        project_id: updatedInvoice.projectId,
        client_id: updatedInvoice.clientId,
        freelancer_id: updatedInvoice.freelancerId,
        amount: updatedInvoice.amount,
        currency: updatedInvoice.currency,
        status: updatedInvoice.status,
        issue_date: updatedInvoice.issueDate.toISOString(),
        due_date: updatedInvoice.dueDate?.toISOString() || null,
        paid_date: updatedInvoice.paidDate?.toISOString() || null,
        description: updatedInvoice.description,
        notes: updatedInvoice.notes,
        created_at: updatedInvoice.createdAt.toISOString(),
        updated_at: updatedInvoice.updatedAt.toISOString(),
        client: {
          id: updatedInvoice.client.id,
          full_name: updatedInvoice.client.fullName,
          email: updatedInvoice.client.email,
        },
        freelancer: {
          id: updatedInvoice.freelancer.id,
          full_name: updatedInvoice.freelancer.fullName,
          email: updatedInvoice.freelancer.email,
        },
      },
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

    // Check if user is the freelancer who created the invoice
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      select: { freelancerId: true, status: true },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (existingInvoice.freelancerId !== user.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Only allow deleting draft invoices
    if (existingInvoice.status !== 'draft') {
      return NextResponse.json({
        error: 'Can only delete draft invoices'
      }, { status: 403 });
    }

    await prisma.invoice.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Invoice deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
