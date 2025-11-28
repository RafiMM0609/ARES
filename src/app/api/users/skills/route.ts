// src/app/api/users/skills/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma, generateUUID, seedInitialSkills } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

// Get all available skills
export async function GET(_request: NextRequest) {
  try {
    // Seed initial skills if needed
    await seedInitialSkills();

    const skills = await prisma.skill.findMany({
      orderBy: { name: 'asc' },
    });

    // Transform to snake_case for API compatibility
    return NextResponse.json({
      skills: skills.map(skill => ({
        id: skill.id,
        name: skill.name,
        category: skill.category,
        created_at: skill.createdAt.toISOString(),
      })),
    });
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

    const skillId = generateUUID();

    try {
      const skill = await prisma.skill.create({
        data: {
          id: skillId,
          name,
          category: category || null,
        },
      });

      return NextResponse.json({
        message: 'Skill created successfully',
        skill: {
          id: skill.id,
          name: skill.name,
          category: skill.category,
          created_at: skill.createdAt.toISOString(),
        },
      }, { status: 201 });
    } catch (insertError) {
      // Check if it's a unique constraint violation
      if ((insertError as Error).message?.includes('Unique constraint')) {
        return NextResponse.json({ error: 'Skill already exists' }, { status: 400 });
      }
      throw insertError;
    }
  } catch (error) {
    console.error('Skill creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
