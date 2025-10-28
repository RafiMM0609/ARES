// src/app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
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

    const supabase = getServiceSupabase();

    let query = supabase
      .from('projects')
      .select(`
        *,
        client:users!client_id(id, full_name, email),
        freelancer:users!freelancer_id(id, full_name, email)
      `);

    // Filter based on type
    if (type === 'my_projects') {
      query = query.or(`client_id.eq.${user.userId},freelancer_id.eq.${user.userId}`);
    } else if (type === 'available') {
      query = query.is('freelancer_id', null).eq('status', 'open');
    } else {
      // Default: show user's projects
      query = query.or(`client_id.eq.${user.userId},freelancer_id.eq.${user.userId}`);
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

    const supabase = getServiceSupabase();

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        title,
        description,
        client_id: user.userId,
        budget_amount,
        budget_currency: budget_currency || 'USD',
        deadline,
        status: status || 'draft',
      })
      .select(`
        *,
        client:users!client_id(id, full_name, email)
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
