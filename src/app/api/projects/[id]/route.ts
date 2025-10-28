// src/app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
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

    const supabase = getServiceSupabase();

    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        client:users!client_id(id, full_name, email, avatar_url),
        freelancer:users!freelancer_id(id, full_name, email, avatar_url),
        milestones:project_milestones(*)
      `)
      .eq('id', id)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: error?.message || 'Project not found' }, { status: 400 });
    }

    // Check if user has access to this project
    if (project.client_id !== user.userId && project.freelancer_id !== user.userId && project.status !== 'open') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

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

    const supabase = getServiceSupabase();

    // First check if user has permission to update this project
    const { data: existingProject } = await supabase
      .from('projects')
      .select('client_id, freelancer_id')
      .eq('id', id)
      .single();

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Only client can update project details
    if (existingProject.client_id !== user.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { data: project, error } = await supabase
      .from('projects')
      .update({
        title,
        description,
        budget_amount,
        budget_currency,
        deadline,
        status,
        freelancer_id,
      })
      .eq('id', id)
      .select(`
        *,
        client:users!client_id(id, full_name, email),
        freelancer:users!freelancer_id(id, full_name, email)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

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

    const supabase = getServiceSupabase();

    // Check if user is the client who created the project
    const { data: existingProject } = await supabase
      .from('projects')
      .select('client_id')
      .eq('id', id)
      .single();

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (existingProject.client_id !== user.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Project deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
