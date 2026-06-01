import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const company = searchParams.get('company') || '';
    const minRating = parseFloat(searchParams.get('minRating') || '0');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const where: Record<string, unknown> = { isApproved: true };
    if (company) where.company = { slug: company };
    if (minRating > 0) where.rating = { gte: minRating };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: { company: { select: { name: true, slug: true, logoUrl: true } } },
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return NextResponse.json({
      data: reviews,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Reviews API error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, title, pros, cons, rating, workLifeBalance, culture, growth, compensation, anonymousRole } = body;

    if (!companyId || !title || !pros || !cons || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        companyId,
        title,
        pros,
        cons,
        rating: Math.min(5, Math.max(1, rating)),
        workLifeBalance: workLifeBalance || 0,
        culture: culture || 0,
        growth: growth || 0,
        compensation: compensation || 0,
        anonymousRole,
        isApproved: false,
      },
    });

    return NextResponse.json({ data: review }, { status: 201 });
  } catch (error) {
    console.error('Review submit error:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
