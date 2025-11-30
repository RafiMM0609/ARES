// src/app/api/applications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma, generateUUID } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

// Get all applications (filtered by user role and optional project)
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const status = searchParams.get('status');
    const viewType = searchParams.get('view_type'); // 'client' or 'freelancer'

    // Get user profile to determine type
    const userProfile = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { userType: true },
    });

    if (!userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build where clause based on view type
    let whereClause: Record<string, unknown> = {};

    if (viewType === 'client') {
      // Client view: show applications for projects they own
      const clientProjects = await prisma.project.findMany({
        where: { clientId: user.userId },
        select: { id: true },
      });
      const projectIds = clientProjects.map(p => p.id);
      
      whereClause.projectId = { in: projectIds };
      
      if (projectId) {
        // Verify the project belongs to this client
        if (!projectIds.includes(projectId)) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
        whereClause.projectId = projectId;
      }
    } else {
      // Freelancer view: show their own applications
      whereClause.freelancerId = user.userId;
      
      if (projectId) {
        whereClause.projectId = projectId;
      }
    }

    // Filter by status if provided
    if (status) {
      whereClause.status = status;
    }

    const applications = await prisma.application.findMany({
      where: whereClause,
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
      orderBy: { createdAt: 'desc' },
    });

    // Transform to snake_case for API compatibility
    return NextResponse.json({
      applications: applications.map(app => ({
        id: app.id,
        project_id: app.projectId,
        freelancer_id: app.freelancerId,
        cover_letter: app.coverLetter,
        proposed_rate: app.proposedRate,
        status: app.status,
        created_at: app.createdAt.toISOString(),
        updated_at: app.updatedAt.toISOString(),
        project: app.project ? {
          id: app.project.id,
          title: app.project.title,
          description: app.project.description,
          budget_amount: app.project.budgetAmount,
          budget_currency: app.project.budgetCurrency,
          status: app.project.status,
          deadline: app.project.deadline?.toISOString() || null,
          client: app.project.client ? {
            id: app.project.client.id,
            full_name: app.project.client.fullName,
            email: app.project.client.email,
            avatar_url: app.project.client.avatarUrl,
          } : null,
        } : null,
        freelancer: app.freelancer ? {
          id: app.freelancer.id,
          full_name: app.freelancer.fullName,
          email: app.freelancer.email,
          avatar_url: app.freelancer.avatarUrl,
          bio: app.freelancer.bio,
        } : null,
      })),
    });
  } catch (error) {
    console.error('Applications fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new application (freelancer applies to a project)
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { project_id, cover_letter, proposed_rate } = body;

    if (!project_id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Check if project exists and is open
    const project = await prisma.project.findUnique({
      where: { id: project_id },
      select: { id: true, status: true, clientId: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (project.status !== 'open') {
      return NextResponse.json(
        { error: 'Project is not accepting applications' },
        { status: 400 }
      );
    }

    // Cannot apply to own project
    if (project.clientId === user.userId) {
      return NextResponse.json(
        { error: 'Cannot apply to your own project' },
        { status: 400 }
      );
    }

    // Check if already applied
    const existingApplication = await prisma.application.findUnique({
      where: {
        projectId_freelancerId: {
          projectId: project_id,
          freelancerId: user.userId,
        },
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied to this project' },
        { status: 400 }
      );
    }

    const applicationId = generateUUID();

    let application;
    try {
      application = await prisma.application.create({
        data: {
          id: applicationId,
          projectId: project_id,
          freelancerId: user.userId,
          coverLetter: cover_letter || null,
          proposedRate: proposed_rate || null,
          status: 'pending',
        },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              budgetAmount: true,
              budgetCurrency: true,
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
    } catch (dbError) {
      // Handle unique constraint violation (race condition)
      if (dbError instanceof Error && dbError.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'You have already applied to this project' },
          { status: 400 }
        );
      }
      throw dbError;
    }

    // Transform to snake_case for API compatibility
    return NextResponse.json({
      message: 'Application submitted successfully',
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
          budget_amount: application.project.budgetAmount,
          budget_currency: application.project.budgetCurrency,
        } : null,
        freelancer: application.freelancer ? {
          id: application.freelancer.id,
          full_name: application.freelancer.fullName,
          email: application.freelancer.email,
        } : null,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Application creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
