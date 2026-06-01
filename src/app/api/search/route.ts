import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    if (q.length < 1) {
      return NextResponse.json({ data: [] });
    }

    const [companies, salaryRoles, salaryLocations] = await Promise.all([
      prisma.company.findMany({
        where: { name: { contains: q } },
        select: { name: true, slug: true, industry: true, logoUrl: true },
        take: limit,
      }),
      prisma.salary.findMany({
        where: { role: { contains: q } },
        select: { role: true },
        distinct: ['role'],
        take: 5,
      }),
      prisma.salary.findMany({
        where: { location: { contains: q } },
        select: { location: true },
        distinct: ['location'],
        take: 5,
      }),
    ]);

    return NextResponse.json({
      data: {
        companies: companies.map((c) => ({ type: 'company', ...c })),
        roles: salaryRoles.map((s) => ({ type: 'role', name: s.role })),
        locations: salaryLocations.map((s) => ({ type: 'location', name: s.location })),
      },
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
