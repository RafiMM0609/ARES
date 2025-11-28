// src/app/api/users/skills/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, generateUUID, getCurrentTimestamp, SkillRow } from '@/lib/sqlite';
import { getUserFromRequest } from '@/lib/auth';

// Get all available skills
export async function GET(_request: NextRequest) {
  try {
    const db = getDatabase();

    const skills = db.prepare('SELECT * FROM skills ORDER BY name').all() as SkillRow[];

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
    const user = getUserFromRequest(request);

    if (!user) {
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

    const db = getDatabase();
    const skillId = generateUUID();
    const now = getCurrentTimestamp();

    try {
      db.prepare(`
        INSERT INTO skills (id, name, category, created_at)
        VALUES (?, ?, ?, ?)
      `).run(skillId, name, category || null, now);
    } catch (insertError) {
      // Check if it's a unique constraint violation
      if ((insertError as Error).message?.includes('UNIQUE constraint failed')) {
        return NextResponse.json({ error: 'Skill already exists' }, { status: 400 });
      }
      throw insertError;
    }

    const skill = db.prepare('SELECT * FROM skills WHERE id = ?').get(skillId) as SkillRow;

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
