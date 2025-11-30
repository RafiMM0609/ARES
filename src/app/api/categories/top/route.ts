// src/app/api/categories/top/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma, seedInitialSkills } from '@/lib/prisma';

// Get top 5 job categories based on skill counts
export async function GET(_request: NextRequest) {
  try {
    // Seed initial skills if needed
    await seedInitialSkills();

    // Get all skills and group by category
    const skills = await prisma.skill.findMany({
      where: {
        category: {
          not: null,
        },
      },
      select: {
        category: true,
      },
    });

    // Count skills per category
    const categoryCount: Record<string, number> = {};
    for (const skill of skills) {
      if (skill.category) {
        categoryCount[skill.category] = (categoryCount[skill.category] || 0) + 1;
      }
    }

    // Sort by count and get top 5
    const topCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return NextResponse.json({
      categories: topCategories,
    });
  } catch (error) {
    console.error('Top categories fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
