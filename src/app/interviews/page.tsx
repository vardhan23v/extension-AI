import Link from 'next/link';
import prisma from '@/lib/db';
import { Card, Badge } from '@/components/ui';
import { getRelativeTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Interview Experiences — TalentDash', description: 'Prepare better with real interview experiences from tech professionals across India.' };

async function getInterviews() {
  return prisma.interview.findMany({
    where: { isApproved: true },
    include: { company: { select: { name: true, slug: true } } },
    orderBy: { submittedAt: 'desc' },
    take: 50,
  });
}

export default async function InterviewsPage() {
  const interviews = await getInterviews();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-h1 text-heading">Interview Experiences</h1>
        <p className="text-body text-muted mt-1">Learn from real interview experiences shared by the community</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 stagger-children">
        {interviews.map((interview) => (
          <Card key={interview.id} hover>
            <div className="flex items-start justify-between mb-3">
              <div>
                <Link href={`/companies/${interview.company.slug}`} className="text-body font-semibold text-primary hover:underline">
                  {interview.company.name}
                </Link>
                <h3 className="text-h4 text-heading mt-1">{interview.role}</h3>
              </div>
              <Badge variant={interview.difficulty === 'Easy' ? 'success' : interview.difficulty === 'Hard' || interview.difficulty === 'Very Hard' ? 'danger' : 'warning'} size="md">
                {interview.difficulty}
              </Badge>
            </div>

            <p className="text-body-sm text-body mb-4">{interview.questions}</p>

            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border">
              <span className={`text-body-sm font-semibold ${interview.result === 'Selected' ? 'text-success' : interview.result === 'Rejected' ? 'text-danger' : 'text-muted'}`}>
                {interview.result === 'Selected' ? '✅' : interview.result === 'Rejected' ? '❌' : '⏳'} {interview.result}
              </span>
              <span className="text-body-sm text-muted">🔄 {interview.rounds} round{interview.rounds > 1 ? 's' : ''}</span>
              <span className="text-caption text-muted ml-auto">{getRelativeTime(new Date(interview.submittedAt))}</span>
            </div>

            {interview.tips && (
              <div className="mt-3 p-3 bg-surface-secondary rounded-lg">
                <p className="text-body-sm text-body">💡 <strong>Tip:</strong> {interview.tips}</p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
