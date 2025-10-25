// src/app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Get all projects (filtered by user)
export async function GET(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type'); // 'my_projects' or 'available'

    let query = supabase
      .from('projects')
      .select(`
        *,
        client:profiles!client_id(id, full_name, email),
        freelancer:profiles!freelancer_id(id, full_name, email)
      `);

    // Filter based on type
    if (type === 'my_projects') {
      query = query.or(`client_id.eq.${user.id},freelancer_id.eq.${user.id}`);
    } else if (type === 'available') {
      query = query.is('freelancer_id', null).eq('status', 'open');
    } else {
      // Default: show user's projects
      query = query.or(`client_id.eq.${user.id},freelancer_id.eq.${user.id}`);
    }

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const { data: projects, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

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
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
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

    const { data: project, error } = await supabase
      .from('projects')
      // @ts-expect-error - Supabase insert types
      .insert({
        title,
        description,
        client_id: user.id,
        budget_amount,
        budget_currency: budget_currency || 'USD',
        deadline,
        status: status || 'draft',
      })
      .select(`
        *,
        client:profiles!client_id(id, full_name, email)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

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
