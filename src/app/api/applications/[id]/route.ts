// src/app/api/applications/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma, generateUUID, generateInvoiceNumber } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

// Get a single application
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

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            description: true,
            budgetAmount: true,
            budgetCurrency: true,
            status: true,
            deadline: true,
            clientId: true,
            client: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        freelancer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            bio: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Check if user has access (either the freelancer or the project client)
    if (application.freelancerId !== user.userId && application.project?.clientId !== user.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Transform to snake_case for API compatibility
    return NextResponse.json({
      application: {
        id: application.id,
        project_id: application.projectId,
        freelancer_id: application.freelancerId,
        cover_letter: application.coverLetter,
        proposed_rate: application.proposedRate,
        status: application.status,
        created_at: application.createdAt.toISOString(),
        updated_at: application.updatedAt.toISOString(),
        project: application.project ? {
          id: application.project.id,
          title: application.project.title,
          description: application.project.description,
          budget_amount: application.project.budgetAmount,
          budget_currency: application.project.budgetCurrency,
          status: application.project.status,
          deadline: application.project.deadline?.toISOString() || null,
          client: application.project.client ? {
            id: application.project.client.id,
            full_name: application.project.client.fullName,
            email: application.project.client.email,
            avatar_url: application.project.client.avatarUrl,
          } : null,
        } : null,
        freelancer: application.freelancer ? {
          id: application.freelancer.id,
          full_name: application.freelancer.fullName,
          email: application.freelancer.email,
          avatar_url: application.freelancer.avatarUrl,
          bio: application.freelancer.bio,
        } : null,
      },
    });
  } catch (error) {
    console.error('Application fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update an application (change status)
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
    const { status, cover_letter, proposed_rate } = body;

    // Get existing application with project budget details
    const existingApplication = await prisma.application.findUnique({
      where: { id },
      include: {
        project: {
          select: { 
            clientId: true, 
            id: true,
            title: true,
            budgetAmount: true,
            budgetCurrency: true,
          },
        },
      },
    });

    if (!existingApplication) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Check permissions
    const isFreelancer = existingApplication.freelancerId === user.userId;
    const isClient = existingApplication.project?.clientId === user.userId;

    if (!isFreelancer && !isClient) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Validate status changes based on user role
    if (status) {
      if (isFreelancer) {
        // Freelancer can only withdraw their application
        if (status !== 'withdrawn') {
          return NextResponse.json(
            { error: 'Freelancers can only withdraw applications' },
            { status: 400 }
          );
        }
      } else if (isClient) {
        // Client can accept or reject applications
        if (!['accepted', 'rejected'].includes(status)) {
          return NextResponse.json(
            { error: 'Clients can only accept or reject applications' },
            { status: 400 }
          );
        }
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (isFreelancer) {
      if (cover_letter !== undefined) updateData.coverLetter = cover_letter;
      if (proposed_rate !== undefined) updateData.proposedRate = proposed_rate;
    }

    const updatedApplication = await prisma.application.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            budgetAmount: true,
            budgetCurrency: true,
            client: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
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

    // If application is accepted, assign freelancer to project and auto-generate invoice
    if (status === 'accepted' && isClient) {
      await prisma.project.update({
        where: { id: existingApplication.projectId },
        data: {
          freelancerId: existingApplication.freelancerId,
          status: 'assigned',
        },
      });

      // Reject other pending applications for this project
      await prisma.application.updateMany({
        where: {
          projectId: existingApplication.projectId,
          id: { not: id },
          status: 'pending',
        },
        data: { status: 'rejected' },
      });

      // Auto-generate invoice for the project
      const project = existingApplication.project;
      if (project && project.budgetAmount && project.budgetAmount > 0) {
        const invoiceId = generateUUID();
        const invoiceNumber = await generateInvoiceNumber();
        
        // Calculate due date (30 days from now by default)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        await prisma.$transaction(async (tx) => {
          // Create the invoice
          await tx.invoice.create({
            data: {
              id: invoiceId,
              invoiceNumber,
              projectId: project.id,
              clientId: project.clientId,
              freelancerId: existingApplication.freelancerId,
              amount: project.budgetAmount!,
              currency: project.budgetCurrency || 'USD',
              dueDate,
              description: `Invoice for project: ${project.title}`,
              notes: 'Auto-generated invoice upon project assignment.',
              status: 'draft',
            },
          });

          // Create invoice item for the project
          await tx.invoiceItem.create({
            data: {
              id: generateUUID(),
              invoiceId,
              description: `Project: ${project.title}`,
              quantity: 1,
              unitPrice: project.budgetAmount!,
              total: project.budgetAmount!,
            },
          });
        });
      }
    }

    // Transform to snake_case for API compatibility
    return NextResponse.json({
      message: 'Application updated successfully',
      application: {
        id: updatedApplication.id,
        project_id: updatedApplication.projectId,
        freelancer_id: updatedApplication.freelancerId,
        cover_letter: updatedApplication.coverLetter,
        proposed_rate: updatedApplication.proposedRate,
        status: updatedApplication.status,
        created_at: updatedApplication.createdAt.toISOString(),
        updated_at: updatedApplication.updatedAt.toISOString(),
        project: updatedApplication.project ? {
          id: updatedApplication.project.id,
          title: updatedApplication.project.title,
          budget_amount: updatedApplication.project.budgetAmount,
          budget_currency: updatedApplication.project.budgetCurrency,
          client: updatedApplication.project.client ? {
            id: updatedApplication.project.client.id,
            full_name: updatedApplication.project.client.fullName,
            email: updatedApplication.project.client.email,
          } : null,
        } : null,
        freelancer: updatedApplication.freelancer ? {
          id: updatedApplication.freelancer.id,
          full_name: updatedApplication.freelancer.fullName,
          email: updatedApplication.freelancer.email,
        } : null,
      },
    });
  } catch (error) {
    console.error('Application update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete an application (only freelancer can delete their own pending application)
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

    const existingApplication = await prisma.application.findUnique({
      where: { id },
      select: { freelancerId: true, status: true },
    });

    if (!existingApplication) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Only freelancer can delete their own application
    if (existingApplication.freelancerId !== user.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Can only delete pending applications
    if (existingApplication.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only delete pending applications' },
        { status: 400 }
      );
    }

    await prisma.application.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Application deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
