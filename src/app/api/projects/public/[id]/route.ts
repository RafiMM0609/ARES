// src/app/api/projects/public/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get a single project publicly (for open projects only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
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

    // Only allow public access to open projects
    if (project.status !== 'open') {
      return NextResponse.json({ error: 'Project not available' }, { status: 403 });
    }

    // Transform to snake_case for API compatibility
    return NextResponse.json({
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
        client_id: project.clientId,
        budget_amount: project.budgetAmount,
        budget_currency: project.budgetCurrency,
        status: project.status,
        deadline: project.deadline?.toISOString() || null,
        created_at: project.createdAt.toISOString(),
        updated_at: project.updatedAt.toISOString(),
        client: project.client ? {
          id: project.client.id,
          full_name: project.client.fullName,
          avatar_url: project.client.avatarUrl,
        } : null,
        milestones: project.milestones.map(m => ({
          id: m.id,
          project_id: m.projectId,
          title: m.title,
          description: m.description,
          amount: m.amount,
          status: m.status,
          due_date: m.dueDate?.toISOString() || null,
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
