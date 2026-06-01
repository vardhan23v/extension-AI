import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, role, level, location, currency, experienceYears, baseSalary, bonus, stock } = body;

    if (!companyId || !role || !level || !location || baseSalary === undefined || experienceYears === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const base = Math.max(0, Number(baseSalary));
    const b = Math.max(0, Number(bonus) || 0);
    const s = Math.max(0, Number(stock) || 0);
    const totalCompensation = base + b + s;

    const salary = await prisma.salary.create({
      data: {
        companyId,
        role,
        level,
        location,
        currency: currency || 'INR',
        experienceYears: Math.max(0, Math.min(50, Number(experienceYears))),
        baseSalary: base,
        bonus: b,
        stock: s,
        totalCompensation,
        source: 'user_submitted',
        confidenceScore: 0.5,
        isVerified: false,
      },
    });

    return NextResponse.json({ data: salary }, { status: 201 });
  } catch (error) {
    console.error('Salary submit error:', error);
    return NextResponse.json({ error: 'Failed to submit salary' }, { status: 500 });
  }
}
