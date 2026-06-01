import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    const comments = await prisma.communityComment.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: comments });
  } catch (error) {
    console.error('Comments API error:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const body = await request.json();
    const { content, authorTag } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 });
    }

    const comment = await prisma.communityComment.create({
      data: {
        postId,
        content,
        authorTag,
      },
    });

    return NextResponse.json({ data: comment }, { status: 201 });
  } catch (error) {
    console.error('Comment submit error:', error);
    return NextResponse.json({ error: 'Failed to submit comment' }, { status: 500 });
  }
}
