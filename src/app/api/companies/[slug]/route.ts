import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const company = await prisma.company.findUnique({
      where: { slug },
      include: {
        workplaceIndex: true,
        salaries: {
          orderBy: { submittedAt: 'desc' },
          take: 50,
        },
        reviews: {
          where: { isApproved: true },
          orderBy: { submittedAt: 'desc' },
          take: 20,
        },
        interviews: {
          where: { isApproved: true },
          orderBy: { submittedAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Aggregate stats
    const salaryStats = await prisma.salary.aggregate({
      where: { companyId: company.id },
      _avg: { totalCompensation: true, baseSalary: true },
      _min: { totalCompensation: true },
      _max: { totalCompensation: true },
      _count: true,
    });

    const reviewStats = await prisma.review.aggregate({
      where: { companyId: company.id, isApproved: true },
      _avg: {
        rating: true,
        workLifeBalance: true,
        culture: true,
        growth: true,
        compensation: true,
      },
      _count: true,
    });

    // Salary by level
    const salaryByLevel = await prisma.salary.groupBy({
      by: ['level'],
      where: { companyId: company.id },
      _avg: { totalCompensation: true },
      _min: { totalCompensation: true },
      _max: { totalCompensation: true },
      _count: true,
    });

    // Salary by location
    const salaryByLocation = await prisma.salary.groupBy({
      by: ['location'],
      where: { companyId: company.id },
      _avg: { totalCompensation: true },
      _count: true,
    });

    return NextResponse.json({
      data: {
        ...company,
        stats: {
          salary: {
            count: salaryStats._count,
            avgCompensation: Math.round(salaryStats._avg.totalCompensation || 0),
            avgBase: Math.round(salaryStats._avg.baseSalary || 0),
            minCompensation: Math.round(salaryStats._min.totalCompensation || 0),
            maxCompensation: Math.round(salaryStats._max.totalCompensation || 0),
          },
          review: {
            count: reviewStats._count,
            avgRating: Math.round((reviewStats._avg.rating || 0) * 10) / 10,
            avgWLB: Math.round((reviewStats._avg.workLifeBalance || 0) * 10) / 10,
            avgCulture: Math.round((reviewStats._avg.culture || 0) * 10) / 10,
            avgGrowth: Math.round((reviewStats._avg.growth || 0) * 10) / 10,
            avgCompensation: Math.round((reviewStats._avg.compensation || 0) * 10) / 10,
          },
          interview: {
            count: company.interviews.length,
          },
          salaryByLevel: salaryByLevel.map((s) => ({
            level: s.level,
            median: Math.round(s._avg.totalCompensation || 0),
            p25: Math.round(s._min.totalCompensation || 0),
            p75: Math.round(s._max.totalCompensation || 0),
            count: s._count,
          })),
          salaryByLocation: salaryByLocation.map((s) => ({
            location: s.location,
            median: Math.round(s._avg.totalCompensation || 0),
            count: s._count,
          })),
        },
      },
    });
  } catch (error) {
    console.error('Company detail API error:', error);
    return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 });
  }
}
