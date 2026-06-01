import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    const where: Record<string, unknown> = {};
    if (category && category !== 'all') where.category = category;

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where,
        include: { _count: { select: { comments: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.communityPost.count({ where }),
    ]);

    return NextResponse.json({
      data: posts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Community API error:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, category, authorTag } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content required' }, { status: 400 });
    }

    const post = await prisma.communityPost.create({
      data: {
        title,
        content,
        category: category || 'general',
        authorTag,
      },
    });

    return NextResponse.json({ data: post }, { status: 201 });
  } catch (error) {
    console.error('Community post error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
