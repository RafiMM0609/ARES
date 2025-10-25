// src/app/api/users/skills/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Get all available skills
export async function GET(_request: NextRequest) {
  try {
    const { data: skills, error } = await supabase
      .from('skills')
      .select('*')
      .order('name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ skills });
  } catch (error) {
    console.error('Skills fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add a new skill to the database
export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, category } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Skill name is required' },
        { status: 400 }
      );
    }

    const { data: skill, error } = await supabase
      .from('skills')
      // @ts-expect-error - Supabase insert types
      .insert({ name, category })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ 
      message: 'Skill created successfully',
      skill 
    }, { status: 201 });
  } catch (error) {
    console.error('Skill creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
