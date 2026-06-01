import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get('industry') || '';
    const search = searchParams.get('search') || '';

    const where: Record<string, unknown> = {};
    if (industry) where.industry = industry;
    if (search) where.name = { contains: search };

    const companies = await prisma.company.findMany({
      where,
      include: {
        _count: { select: { salaries: true, reviews: true, interviews: true } },
        workplaceIndex: { select: { overallScore: true } },
      },
      orderBy: { name: 'asc' },
    });

    // Get aggregate salary data per company
    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        const salaryStats = await prisma.salary.aggregate({
          where: { companyId: company.id },
          _avg: { totalCompensation: true },
          _min: { totalCompensation: true },
          _max: { totalCompensation: true },
        });

        const reviewStats = await prisma.review.aggregate({
          where: { companyId: company.id, isApproved: true },
          _avg: { rating: true },
        });

        return {
          ...company,
          avgCompensation: Math.round(salaryStats._avg.totalCompensation || 0),
          minCompensation: Math.round(salaryStats._min.totalCompensation || 0),
          maxCompensation: Math.round(salaryStats._max.totalCompensation || 0),
          avgRating: Math.round((reviewStats._avg.rating || 0) * 10) / 10,
        };
      })
    );

    return NextResponse.json({ data: companiesWithStats });
  } catch (error) {
    console.error('Companies API error:', error);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}
