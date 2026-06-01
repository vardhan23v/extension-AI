import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyA = searchParams.get('a') || '';
    const companyB = searchParams.get('b') || '';

    if (!companyA || !companyB) {
      return NextResponse.json({ error: 'Both company slugs required (a, b)' }, { status: 400 });
    }

    const [a, b] = await Promise.all([
      getCompanyData(companyA),
      getCompanyData(companyB),
    ]);

    if (!a || !b) {
      return NextResponse.json({ error: 'One or both companies not found' }, { status: 404 });
    }

    return NextResponse.json({ data: { companyA: a, companyB: b } });
  } catch (error) {
    console.error('Compare API error:', error);
    return NextResponse.json({ error: 'Failed to compare companies' }, { status: 500 });
  }
}

async function getCompanyData(slug: string) {
  const company = await prisma.company.findUnique({
    where: { slug },
    include: { workplaceIndex: true },
  });

  if (!company) return null;

  const salaryStats = await prisma.salary.aggregate({
    where: { companyId: company.id },
    _avg: { totalCompensation: true, baseSalary: true, bonus: true, stock: true },
    _min: { totalCompensation: true },
    _max: { totalCompensation: true },
    _count: true,
  });

  const reviewStats = await prisma.review.aggregate({
    where: { companyId: company.id, isApproved: true },
    _avg: { rating: true, workLifeBalance: true, culture: true, growth: true, compensation: true },
    _count: true,
  });

  const interviewCount = await prisma.interview.count({
    where: { companyId: company.id, isApproved: true },
  });

  const salaryByLevel = await prisma.salary.groupBy({
    by: ['level'],
    where: { companyId: company.id },
    _avg: { totalCompensation: true },
    _count: true,
  });

  return {
    ...company,
    salary: {
      count: salaryStats._count,
      avgTC: Math.round(salaryStats._avg.totalCompensation || 0),
      avgBase: Math.round(salaryStats._avg.baseSalary || 0),
      avgBonus: Math.round(salaryStats._avg.bonus || 0),
      avgStock: Math.round(salaryStats._avg.stock || 0),
      minTC: Math.round(salaryStats._min.totalCompensation || 0),
      maxTC: Math.round(salaryStats._max.totalCompensation || 0),
    },
    review: {
      count: reviewStats._count,
      avgRating: Math.round((reviewStats._avg.rating || 0) * 10) / 10,
      avgWLB: Math.round((reviewStats._avg.workLifeBalance || 0) * 10) / 10,
      avgCulture: Math.round((reviewStats._avg.culture || 0) * 10) / 10,
      avgGrowth: Math.round((reviewStats._avg.growth || 0) * 10) / 10,
      avgCompensation: Math.round((reviewStats._avg.compensation || 0) * 10) / 10,
    },
    interviewCount,
    salaryByLevel: salaryByLevel.map((s) => ({
      level: s.level,
      avgTC: Math.round(s._avg.totalCompensation || 0),
      count: s._count,
    })),
  };
}
