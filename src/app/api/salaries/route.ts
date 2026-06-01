import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const company = searchParams.get('company') || '';
    const role = searchParams.get('role') || '';
    const level = searchParams.get('level') || '';
    const location = searchParams.get('location') || '';
    const minExp = parseInt(searchParams.get('minExp') || '0');
    const maxExp = parseInt(searchParams.get('maxExp') || '50');
    const minComp = parseInt(searchParams.get('minComp') || '0');
    const maxComp = parseInt(searchParams.get('maxComp') || '0');
    const sortBy = searchParams.get('sortBy') || 'submittedAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const where: Record<string, unknown> = {
      experienceYears: { gte: minExp, lte: maxExp },
    };

    if (company) {
      where.company = { slug: company };
    }
    if (role) where.role = { contains: role };
    if (level) where.level = level;
    if (location) where.location = location;
    if (maxComp > 0) {
      where.totalCompensation = { gte: minComp, lte: maxComp };
    } else if (minComp > 0) {
      where.totalCompensation = { gte: minComp };
    }

    const [salaries, total] = await Promise.all([
      prisma.salary.findMany({
        where,
        include: { company: { select: { name: true, slug: true, logoUrl: true } } },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.salary.count({ where }),
    ]);

    return NextResponse.json({
      data: salaries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Salaries API error:', error);
    return NextResponse.json({ error: 'Failed to fetch salaries' }, { status: 500 });
  }
}
