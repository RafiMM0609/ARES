// src/app/api/categories/top/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma, seedInitialSkills } from '@/lib/prisma';

// Get top 5 job categories based on skill counts
export async function GET(_request: NextRequest) {
  try {
    // Seed initial skills if needed
    await seedInitialSkills();

    // Use Prisma's groupBy to aggregate skill counts by category at the database level
    const categoryCounts = await prisma.skill.groupBy({
      by: ['category'],
      where: {
        category: {
          not: null,
        },
      },
      _count: {
        category: true,
      },
      orderBy: {
        _count: {
          category: 'desc',
        },
      },
      take: 5,
    });

    // Transform the result to the expected format
    const topCategories = categoryCounts.map((item) => ({
      name: item.category as string,
      count: item._count.category,
    }));

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
