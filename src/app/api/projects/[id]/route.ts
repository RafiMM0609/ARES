// src/app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, getCurrentTimestamp, ProjectRow, UserRow } from '@/lib/sqlite';
import { getUserFromRequest } from '@/lib/auth';

interface ProjectMilestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  amount: number;
  status: string;
  due_date: string | null;
  completed_date: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectWithRelations extends ProjectRow {
  client?: Pick<UserRow, 'id' | 'full_name' | 'email' | 'avatar_url'> | null;
  freelancer?: Pick<UserRow, 'id' | 'full_name' | 'email' | 'avatar_url'> | null;
  milestones?: ProjectMilestone[];
}

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

    const db = getDatabase();

    const row = db.prepare(`
      SELECT p.*,
        c.id as client_id_ref, c.full_name as client_full_name, c.email as client_email, c.avatar_url as client_avatar_url,
        f.id as freelancer_id_ref, f.full_name as freelancer_full_name, f.email as freelancer_email, f.avatar_url as freelancer_avatar_url
      FROM projects p
      LEFT JOIN users c ON p.client_id = c.id
      LEFT JOIN users f ON p.freelancer_id = f.id
      WHERE p.id = ?
    `).get(id) as (ProjectRow & {
      client_id_ref: string;
      client_full_name: string | null;
      client_email: string;
      client_avatar_url: string | null;
      freelancer_id_ref: string | null;
      freelancer_full_name: string | null;
      freelancer_email: string | null;
      freelancer_avatar_url: string | null;
    }) | undefined;

    if (!row) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user has access to this project
    if (row.client_id !== user.userId && row.freelancer_id !== user.userId && row.status !== 'open') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get milestones
    const milestones = db.prepare(`
      SELECT * FROM project_milestones WHERE project_id = ? ORDER BY created_at
    `).all(id) as ProjectMilestone[];

    const project: ProjectWithRelations = {
      id: row.id,
      title: row.title,
      description: row.description,
      client_id: row.client_id,
      freelancer_id: row.freelancer_id,
      budget_amount: row.budget_amount,
      budget_currency: row.budget_currency,
      status: row.status,
      deadline: row.deadline,
      start_date: row.start_date,
      completion_date: row.completion_date,
      created_at: row.created_at,
      updated_at: row.updated_at,
      client: row.client_id_ref ? {
        id: row.client_id_ref,
        full_name: row.client_full_name,
        email: row.client_email,
        avatar_url: row.client_avatar_url,
      } : null,
      freelancer: row.freelancer_id_ref ? {
        id: row.freelancer_id_ref,
        full_name: row.freelancer_full_name,
        email: row.freelancer_email!,
        avatar_url: row.freelancer_avatar_url,
      } : null,
      milestones,
    };

    return NextResponse.json({ project });
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

    const db = getDatabase();

    // First check if user has permission to update this project
    const existingProject = db.prepare('SELECT client_id, freelancer_id FROM projects WHERE id = ?').get(id) as Pick<ProjectRow, 'client_id' | 'freelancer_id'> | undefined;

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Only client can update project details
    if (existingProject.client_id !== user.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const now = getCurrentTimestamp();

    db.prepare(`
      UPDATE projects SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        budget_amount = COALESCE(?, budget_amount),
        budget_currency = COALESCE(?, budget_currency),
        deadline = COALESCE(?, deadline),
        status = COALESCE(?, status),
        freelancer_id = COALESCE(?, freelancer_id),
        updated_at = ?
      WHERE id = ?
    `).run(title, description, budget_amount, budget_currency, deadline, status, freelancer_id, now, id);

    // Fetch updated project
    const row = db.prepare(`
      SELECT p.*,
        c.id as client_id_ref, c.full_name as client_full_name, c.email as client_email,
        f.id as freelancer_id_ref, f.full_name as freelancer_full_name, f.email as freelancer_email
      FROM projects p
      LEFT JOIN users c ON p.client_id = c.id
      LEFT JOIN users f ON p.freelancer_id = f.id
      WHERE p.id = ?
    `).get(id) as ProjectRow & {
      client_id_ref: string;
      client_full_name: string | null;
      client_email: string;
      freelancer_id_ref: string | null;
      freelancer_full_name: string | null;
      freelancer_email: string | null;
    };

    const project = {
      ...row,
      client: row.client_id_ref ? {
        id: row.client_id_ref,
        full_name: row.client_full_name,
        email: row.client_email,
      } : null,
      freelancer: row.freelancer_id_ref ? {
        id: row.freelancer_id_ref,
        full_name: row.freelancer_full_name,
        email: row.freelancer_email,
      } : null,
    };

    return NextResponse.json({ 
      message: 'Project updated successfully',
      project 
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

    const db = getDatabase();

    // Check if user is the client who created the project
    const existingProject = db.prepare('SELECT client_id FROM projects WHERE id = ?').get(id) as Pick<ProjectRow, 'client_id'> | undefined;

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (existingProject.client_id !== user.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    db.prepare('DELETE FROM projects WHERE id = ?').run(id);

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Project deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
