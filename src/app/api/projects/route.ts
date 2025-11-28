// src/app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma, generateUUID } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

// Get all projects (filtered by user)
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type'); // 'my_projects' or 'available'

    // Build where clause
    let whereClause: Record<string, unknown> = {};

    // Filter based on type
    if (type === 'my_projects') {
      whereClause = {
        OR: [
          { clientId: user.userId },
          { freelancerId: user.userId },
        ],
      };
    } else if (type === 'available') {
      whereClause = {
        freelancerId: null,
        status: 'open',
      };
    } else {
      // Default: show user's projects
      whereClause = {
        OR: [
          { clientId: user.userId },
          { freelancerId: user.userId },
        ],
      };
    }

    // Filter by status if provided
    if (status) {
      whereClause.status = status;
    }

    const projects = await prisma.project.findMany({
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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to snake_case for API compatibility
    return NextResponse.json({
      projects: projects.map(project => ({
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
        } : null,
        freelancer: project.freelancer ? {
          id: project.freelancer.id,
          full_name: project.freelancer.fullName,
          email: project.freelancer.email,
        } : null,
      })),
    });
  } catch (error) {
    console.error('Projects fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new project
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, budget_amount, budget_currency, deadline, status } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Project title is required' },
        { status: 400 }
      );
    }

    const projectId = generateUUID();

    const project = await prisma.project.create({
      data: {
        id: projectId,
        title,
        description: description || null,
        clientId: user.userId,
        budgetAmount: budget_amount || null,
        budgetCurrency: budget_currency || 'USD',
        deadline: deadline ? new Date(deadline) : null,
        status: status || 'draft',
      },
      include: {
        client: {
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
      message: 'Project created successfully',
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
        } : null,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Project creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
