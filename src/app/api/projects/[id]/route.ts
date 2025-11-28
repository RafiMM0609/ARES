// src/app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

// Get a single project
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

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        freelancer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        milestones: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user has access to this project
    if (project.clientId !== user.userId && project.freelancerId !== user.userId && project.status !== 'open') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Transform to snake_case for API compatibility
    return NextResponse.json({
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
        client_id: project.clientId,
        freelancer_id: project.freelancerId,
        budget_amount: project.budgetAmount,
        budget_currency: project.budgetCurrency,
        status: project.status,
        deadline: project.deadline?.toISOString() || null,
        start_date: project.startDate?.toISOString() || null,
        completion_date: project.completionDate?.toISOString() || null,
        created_at: project.createdAt.toISOString(),
        updated_at: project.updatedAt.toISOString(),
        client: project.client ? {
          id: project.client.id,
          full_name: project.client.fullName,
          email: project.client.email,
          avatar_url: project.client.avatarUrl,
        } : null,
        freelancer: project.freelancer ? {
          id: project.freelancer.id,
          full_name: project.freelancer.fullName,
          email: project.freelancer.email,
          avatar_url: project.freelancer.avatarUrl,
        } : null,
        milestones: project.milestones.map(m => ({
          id: m.id,
          project_id: m.projectId,
          title: m.title,
          description: m.description,
          amount: m.amount,
          status: m.status,
          due_date: m.dueDate?.toISOString() || null,
          completed_date: m.completedDate?.toISOString() || null,
          created_at: m.createdAt.toISOString(),
          updated_at: m.updatedAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('Project fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update a project
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
    const { title, description, budget_amount, budget_currency, deadline, status, freelancer_id } = body;

    // First check if user has permission to update this project
    const existingProject = await prisma.project.findUnique({
      where: { id },
      select: { clientId: true, freelancerId: true },
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Only client can update project details
    if (existingProject.clientId !== user.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        budgetAmount: budget_amount !== undefined ? budget_amount : undefined,
        budgetCurrency: budget_currency !== undefined ? budget_currency : undefined,
        deadline: deadline !== undefined ? (deadline ? new Date(deadline) : null) : undefined,
        status: status !== undefined ? status : undefined,
        freelancerId: freelancer_id !== undefined ? freelancer_id : undefined,
      },
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

    // Transform to snake_case for API compatibility
    return NextResponse.json({
      message: 'Project updated successfully',
      project: {
        id: updatedProject.id,
        title: updatedProject.title,
        description: updatedProject.description,
        client_id: updatedProject.clientId,
        freelancer_id: updatedProject.freelancerId,
        budget_amount: updatedProject.budgetAmount,
        budget_currency: updatedProject.budgetCurrency,
        status: updatedProject.status,
        deadline: updatedProject.deadline?.toISOString() || null,
        start_date: updatedProject.startDate?.toISOString() || null,
        completion_date: updatedProject.completionDate?.toISOString() || null,
        created_at: updatedProject.createdAt.toISOString(),
        updated_at: updatedProject.updatedAt.toISOString(),
        client: updatedProject.client ? {
          id: updatedProject.client.id,
          full_name: updatedProject.client.fullName,
          email: updatedProject.client.email,
        } : null,
        freelancer: updatedProject.freelancer ? {
          id: updatedProject.freelancer.id,
          full_name: updatedProject.freelancer.fullName,
          email: updatedProject.freelancer.email,
        } : null,
      },
    });
  } catch (error) {
    console.error('Project update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a project
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

    // Check if user is the client who created the project
    const existingProject = await prisma.project.findUnique({
      where: { id },
      select: { clientId: true },
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (existingProject.clientId !== user.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Project deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
