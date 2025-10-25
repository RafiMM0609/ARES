// src/app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Get a single project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        client:profiles!client_id(id, full_name, email, avatar_url),
        freelancer:profiles!freelancer_id(id, full_name, email, avatar_url),
        milestones:project_milestones(*)
      `)
      .eq('id', id)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: error?.message || 'Project not found' }, { status: 400 });
    }

    // @ts-expect-error - Supabase types with select
    // Check if user has access to this project
    if (project.client_id !== user.id && project.freelancer_id !== user.id && project.status !== 'open') {
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, budget_amount, budget_currency, deadline, status, freelancer_id } = body;

    // First check if user has permission to update this project
    const { data: existingProject } = await supabase
      .from('projects')
      .select('client_id, freelancer_id')
      .eq('id', id)
      .single();

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // @ts-expect-error - Supabase types with select
    // Only client can update project details
    if (existingProject.client_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { data: project, error } = await supabase
      .from('projects')
      // @ts-expect-error - Supabase update types
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
        client:profiles!client_id(id, full_name, email),
        freelancer:profiles!freelancer_id(id, full_name, email)
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is the client who created the project
    const { data: existingProject } = await supabase
      .from('projects')
      .select('client_id')
      .eq('id', id)
      .single();

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // @ts-expect-error - Supabase types with select
    if (existingProject.client_id !== user.id) {
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
