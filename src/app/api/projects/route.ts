// src/app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, generateUUID, getCurrentTimestamp, ProjectRow, UserRow } from '@/lib/sqlite';
import { getUserFromRequest } from '@/lib/auth';

interface ProjectWithRelations extends ProjectRow {
  client?: Pick<UserRow, 'id' | 'full_name' | 'email'> | null;
  freelancer?: Pick<UserRow, 'id' | 'full_name' | 'email'> | null;
}

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

    const db = getDatabase();

    let query = `
      SELECT p.*,
        c.id as client_id_ref, c.full_name as client_full_name, c.email as client_email,
        f.id as freelancer_id_ref, f.full_name as freelancer_full_name, f.email as freelancer_email
      FROM projects p
      LEFT JOIN users c ON p.client_id = c.id
      LEFT JOIN users f ON p.freelancer_id = f.id
      WHERE 1=1
    `;
    const params: (string | null)[] = [];

    // Filter based on type
    if (type === 'my_projects') {
      query += ' AND (p.client_id = ? OR p.freelancer_id = ?)';
      params.push(user.userId, user.userId);
    } else if (type === 'available') {
      query += ' AND p.freelancer_id IS NULL AND p.status = ?';
      params.push('open');
    } else {
      // Default: show user's projects
      query += ' AND (p.client_id = ? OR p.freelancer_id = ?)';
      params.push(user.userId, user.userId);
    }

    // Filter by status if provided
    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    query += ' ORDER BY p.created_at DESC';

    const rows = db.prepare(query).all(...params) as Array<ProjectRow & {
      client_id_ref: string;
      client_full_name: string | null;
      client_email: string;
      freelancer_id_ref: string | null;
      freelancer_full_name: string | null;
      freelancer_email: string | null;
    }>;

    // Transform rows to include nested client and freelancer objects
    const projects: ProjectWithRelations[] = rows.map(row => ({
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
      } : null,
      freelancer: row.freelancer_id_ref ? {
        id: row.freelancer_id_ref,
        full_name: row.freelancer_full_name,
        email: row.freelancer_email!,
      } : null,
    }));

    return NextResponse.json({ projects });
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

    const db = getDatabase();
    const projectId = generateUUID();
    const now = getCurrentTimestamp();

    db.prepare(`
      INSERT INTO projects (id, title, description, client_id, budget_amount, budget_currency, deadline, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      projectId,
      title,
      description || null,
      user.userId,
      budget_amount || null,
      budget_currency || 'USD',
      deadline || null,
      status || 'draft',
      now,
      now
    );

    // Fetch the created project with client info
    const row = db.prepare(`
      SELECT p.*,
        c.id as client_id_ref, c.full_name as client_full_name, c.email as client_email
      FROM projects p
      LEFT JOIN users c ON p.client_id = c.id
      WHERE p.id = ?
    `).get(projectId) as ProjectRow & {
      client_id_ref: string;
      client_full_name: string | null;
      client_email: string;
    };

    const project: ProjectWithRelations = {
      ...row,
      client: {
        id: row.client_id_ref,
        full_name: row.client_full_name,
        email: row.client_email,
      },
    };

    return NextResponse.json({ 
      message: 'Project created successfully',
      project 
    }, { status: 201 });
  } catch (error) {
    console.error('Project creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
