import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'overallScore';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const industry = searchParams.get('industry') || '';

    const companyWhere: Record<string, unknown> = {};
    if (industry) companyWhere.industry = industry;

    const rankings = await prisma.workplaceIndex.findMany({
      where: companyWhere.industry ? { company: companyWhere } : {},
      include: {
        company: {
          select: { name: true, slug: true, industry: true, headquarters: true, logoUrl: true },
        },
      },
      orderBy: { [sortBy]: sortOrder },
    });

    return NextResponse.json({ data: rankings });
  } catch (error) {
    console.error('Workplace Index API error:', error);
    return NextResponse.json({ error: 'Failed to fetch rankings' }, { status: 500 });
  }
}
