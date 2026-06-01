import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const company = searchParams.get('company') || '';
    const difficulty = searchParams.get('difficulty') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const where: Record<string, unknown> = { isApproved: true };
    if (company) where.company = { slug: company };
    if (difficulty) where.difficulty = difficulty;

    const [interviews, total] = await Promise.all([
      prisma.interview.findMany({
        where,
        include: { company: { select: { name: true, slug: true, logoUrl: true } } },
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.interview.count({ where }),
    ]);

    return NextResponse.json({
      data: interviews,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Interviews API error:', error);
    return NextResponse.json({ error: 'Failed to fetch interviews' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, role, difficulty, rounds, questions, result, tips } = body;

    if (!companyId || !role || !difficulty || !questions || !result) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const interview = await prisma.interview.create({
      data: {
        companyId,
        role,
        difficulty,
        rounds: rounds || 1,
        questions,
        result,
        tips,
        isApproved: false,
      },
    });

    return NextResponse.json({ data: interview }, { status: 201 });
  } catch (error) {
    console.error('Interview submit error:', error);
    return NextResponse.json({ error: 'Failed to submit interview' }, { status: 500 });
  }
}
