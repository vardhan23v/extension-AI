import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/db';
import { formatCurrency, formatCompactNumber, LEVEL_LABELS } from '@/lib/utils';
import { Card, Badge, StarRating } from '@/components/ui';
import { SalaryByLevelChart, RatingBreakdownChart, SalaryByLocationChart } from '@/components/charts';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const company = await prisma.company.findUnique({ where: { slug }, select: { name: true, industry: true } });
  if (!company) return { title: 'Company Not Found — TalentDash' };
  return {
    title: `${company.name} — Salaries, Reviews & Interviews | TalentDash`,
    description: `Explore ${company.name} compensation data, workplace reviews, and interview experiences. ${company.industry} company on TalentDash.`,
  };
}

async function getCompanyData(slug: string) {
  const company = await prisma.company.findUnique({
    where: { slug },
    include: { workplaceIndex: true },
  });
  if (!company) return null;

  const [salaryStats, reviewStats, salaryByLevel, salaryByLocation, reviews, interviews, salaryCount, reviewCount, interviewCount] = await Promise.all([
    prisma.salary.aggregate({
      where: { companyId: company.id },
      _avg: { totalCompensation: true, baseSalary: true },
      _min: { totalCompensation: true },
      _max: { totalCompensation: true },
    }),
    prisma.review.aggregate({
      where: { companyId: company.id, isApproved: true },
      _avg: { rating: true, workLifeBalance: true, culture: true, growth: true, compensation: true },
    }),
    prisma.salary.groupBy({
      by: ['level'],
      where: { companyId: company.id },
      _avg: { totalCompensation: true },
      _min: { totalCompensation: true },
      _max: { totalCompensation: true },
      _count: true,
    }),
    prisma.salary.groupBy({
      by: ['location'],
      where: { companyId: company.id },
      _avg: { totalCompensation: true },
      _count: true,
    }),
    prisma.review.findMany({
      where: { companyId: company.id, isApproved: true },
      orderBy: { submittedAt: 'desc' },
      take: 10,
    }),
    prisma.interview.findMany({
      where: { companyId: company.id, isApproved: true },
      orderBy: { submittedAt: 'desc' },
      take: 10,
    }),
    prisma.salary.count({ where: { companyId: company.id } }),
    prisma.review.count({ where: { companyId: company.id, isApproved: true } }),
    prisma.interview.count({ where: { companyId: company.id, isApproved: true } }),
  ]);

  return {
    company,
    salaryStats,
    reviewStats,
    salaryByLevel: salaryByLevel.map(s => ({
      level: LEVEL_LABELS[s.level] || s.level,
      median: Math.round(s._avg.totalCompensation || 0),
      p25: Math.round(s._min.totalCompensation || 0),
      p75: Math.round(s._max.totalCompensation || 0),
    })),
    salaryByLocation: salaryByLocation.map(s => ({
      location: s.location,
      median: Math.round(s._avg.totalCompensation || 0),
      count: s._count,
    })),
    reviews,
    interviews,
    counts: { salary: salaryCount, review: reviewCount, interview: interviewCount },
    ratingBreakdown: [
      { category: 'Work-Life Balance', score: reviewStats._avg.workLifeBalance || 0 },
      { category: 'Culture', score: reviewStats._avg.culture || 0 },
      { category: 'Growth', score: reviewStats._avg.growth || 0 },
      { category: 'Compensation', score: reviewStats._avg.compensation || 0 },
      { category: 'Overall', score: reviewStats._avg.rating || 0 },
    ],
  };
}

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getCompanyData(slug);
  if (!data) notFound();

  const { company, salaryStats, reviewStats, salaryByLevel, salaryByLocation, reviews, interviews, counts, ratingBreakdown } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Company Header */}
      <div className="flex flex-col sm:flex-row items-start gap-6 mb-10">
        <CompanyAvatar name={company.name} />
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-h1 text-heading">{company.name}</h1>
            <Badge variant="primary">{company.industry}</Badge>
          </div>
          {company.description && <p className="text-body text-muted mb-3">{company.description}</p>}
          <div className="flex flex-wrap items-center gap-4 text-body-sm text-muted">
            <span>📍 {company.headquarters}</span>
            {company.foundedYear && <span>Founded {company.foundedYear}</span>}
            {company.headcountRange && <span>👥 {company.headcountRange}</span>}
            {company.website && (
              <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {company.website.replace('https://', '')}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10 stagger-children">
        <Card padding="sm">
          <div className="text-caption text-muted uppercase tracking-wider mb-1">Avg Total Comp</div>
          <div className="text-h3 text-primary font-bold">{formatCurrency(salaryStats._avg.totalCompensation || 0)}</div>
          <div className="text-caption text-muted">{counts.salary} data points</div>
        </Card>
        <Card padding="sm">
          <div className="text-caption text-muted uppercase tracking-wider mb-1">Company Rating</div>
          <div className="flex items-center gap-2">
            <span className="text-h3 text-heading font-bold">{(reviewStats._avg.rating || 0).toFixed(1)}</span>
            <StarRating rating={reviewStats._avg.rating || 0} size="sm" />
          </div>
          <div className="text-caption text-muted">{counts.review} reviews</div>
        </Card>
        <Card padding="sm">
          <div className="text-caption text-muted uppercase tracking-wider mb-1">Workplace Score</div>
          <div className="text-h3 text-heading font-bold">{company.workplaceIndex?.overallScore?.toFixed(1) || '—'}/5</div>
          <div className="text-caption text-muted">WPI Score</div>
        </Card>
        <Card padding="sm">
          <div className="text-caption text-muted uppercase tracking-wider mb-1">Interviews</div>
          <div className="text-h3 text-heading font-bold">{counts.interview}</div>
          <div className="text-caption text-muted">experiences shared</div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-10">
        {salaryByLevel.length > 0 && (
          <Card>
            <h2 className="text-h3 text-heading mb-4">Compensation by Level</h2>
            <SalaryByLevelChart data={salaryByLevel} />
          </Card>
        )}
        {ratingBreakdown.some(r => r.score > 0) && (
          <Card>
            <h2 className="text-h3 text-heading mb-4">Rating Breakdown</h2>
            <RatingBreakdownChart data={ratingBreakdown} />
          </Card>
        )}
      </div>

      {salaryByLocation.length > 0 && (
        <Card className="mb-10">
          <h2 className="text-h3 text-heading mb-4">Compensation by Location</h2>
          <SalaryByLocationChart data={salaryByLocation} />
        </Card>
      )}

      {/* Reviews & Interviews */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-h3 text-heading mb-4">Recent Reviews ({counts.review})</h2>
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} padding="sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-body font-semibold text-heading">{review.title}</h3>
                  <StarRating rating={review.rating} size="sm" />
                </div>
                <p className="text-body-sm text-success mb-1"><strong>Pros:</strong> {review.pros}</p>
                <p className="text-body-sm text-danger mb-2"><strong>Cons:</strong> {review.cons}</p>
                {review.anonymousRole && <span className="text-caption text-muted">{review.anonymousRole}</span>}
              </Card>
            ))}
            {reviews.length === 0 && <p className="text-body text-muted py-8 text-center">No reviews yet. Be the first to review!</p>}
          </div>
        </div>
        <div>
          <h2 className="text-h3 text-heading mb-4">Interview Experiences ({counts.interview})</h2>
          <div className="space-y-4">
            {interviews.map((interview) => (
              <Card key={interview.id} padding="sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-body font-semibold text-heading">{interview.role}</h3>
                  <Badge variant={interview.difficulty === 'Easy' ? 'success' : interview.difficulty === 'Hard' || interview.difficulty === 'Very Hard' ? 'danger' : 'warning'}>{interview.difficulty}</Badge>
                </div>
                <p className="text-body-sm text-muted line-clamp-3 mb-2">{interview.questions}</p>
                <div className="flex items-center gap-3 text-caption">
                  <span className={interview.result === 'Selected' ? 'text-success font-semibold' : interview.result === 'Rejected' ? 'text-danger font-semibold' : 'text-muted'}>{interview.result}</span>
                  <span className="text-muted">{interview.rounds} rounds</span>
                </div>
                {interview.tips && <p className="text-body-sm text-muted mt-2 italic">💡 {interview.tips}</p>}
              </Card>
            ))}
            {interviews.length === 0 && <p className="text-body text-muted py-8 text-center">No interviews yet. Share your experience!</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompanyAvatar({ name }: { name: string }) {
  const colors = ['bg-red-100 text-red-700', 'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-purple-100 text-purple-700', 'bg-amber-100 text-amber-700', 'bg-cyan-100 text-cyan-700'];
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0 ${colors[idx]}`}>{initials}</div>;
}
