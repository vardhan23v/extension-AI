import Link from 'next/link';
import prisma from '@/lib/db';
import { formatCompactNumber, formatCurrency } from '@/lib/utils';
import { Card } from '@/components/ui';

// Force dynamic rendering to avoid build-time DB issues
export const dynamic = 'force-dynamic';

async function getHomeData() {
  const [
    topCompanies,
    recentReviews,
    recentInterviews,
    salaryCount,
    companyCount,
    reviewCount,
    interviewCount,
    rankings,
  ] = await Promise.all([
    prisma.company.findMany({
      include: {
        _count: { select: { salaries: true, reviews: true } },
        workplaceIndex: { select: { overallScore: true } },
      },
      take: 8,
    }).then(async (companies) => {
      const withStats = await Promise.all(
        companies.map(async (c) => {
          const stats = await prisma.salary.aggregate({
            where: { companyId: c.id },
            _avg: { totalCompensation: true },
          });
          return { ...c, avgTC: Math.round(stats._avg.totalCompensation || 0) };
        })
      );
      return withStats.sort((a, b) => b.avgTC - a.avgTC);
    }),
    prisma.review.findMany({
      where: { isApproved: true },
      include: { company: { select: { name: true, slug: true } } },
      orderBy: { submittedAt: 'desc' },
      take: 3,
    }),
    prisma.interview.findMany({
      where: { isApproved: true },
      include: { company: { select: { name: true, slug: true } } },
      orderBy: { submittedAt: 'desc' },
      take: 3,
    }),
    prisma.salary.count(),
    prisma.company.count(),
    prisma.review.count({ where: { isApproved: true } }),
    prisma.interview.count({ where: { isApproved: true } }),
    prisma.workplaceIndex.findMany({
      include: { company: { select: { name: true, slug: true, industry: true } } },
      orderBy: { overallScore: 'desc' },
      take: 5,
    }),
  ]);

  return { topCompanies, recentReviews, recentInterviews, salaryCount, companyCount, reviewCount, interviewCount, rankings };
}

export default async function Home() {
  const data = await getHomeData();

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="gradient-hero py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-light text-primary text-sm font-semibold mb-6">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              India&apos;s Career Intelligence Platform
            </span>
            <h1 className="text-display text-heading mb-6">
              Know your <span className="text-primary">worth</span>.
              <br />Make smarter career moves.
            </h1>
            <p className="text-body-lg text-muted max-w-xl mx-auto mb-8">
              Compare salaries, research companies, read real reviews, and prepare for interviews. Data-driven insights for tech professionals.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-12">
              <Link href="/salaries" className="group flex items-center gap-3 bg-white rounded-2xl px-6 py-4 shadow-md hover:shadow-lg transition-all duration-300 border border-border hover:border-primary/30">
                <svg className="w-5 h-5 text-muted group-hover:text-primary transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
                <span className="text-muted text-left flex-1">Search salaries, companies, or roles...</span>
                <span className="text-xs text-muted bg-surface-secondary px-2 py-1 rounded">⌘K</span>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto stagger-children">
              <StatCounter value={data.salaryCount} label="Salary Records" />
              <StatCounter value={data.companyCount} label="Companies" />
              <StatCounter value={data.reviewCount} label="Reviews" />
              <StatCounter value={data.interviewCount} label="Interviews" />
            </div>
          </div>
        </div>
      </section>

      {/* Top Paying Companies */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-h2 text-heading">Top Paying Companies</h2>
              <p className="text-body text-muted mt-1">Average total compensation across all levels</p>
            </div>
            <Link href="/salaries" className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors">
              View all →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
            {data.topCompanies.slice(0, 8).map((company, idx) => (
              <Link key={company.id} href={`/companies/${company.slug}`}>
                <Card hover className="relative overflow-hidden">
                  {idx < 3 && (
                    <div className={`absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : 'bg-amber-600'}`}>
                      {idx + 1}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <CompanyAvatar name={company.name} />
                    <div>
                      <h3 className="text-h4 text-heading leading-tight">{company.name}</h3>
                      <span className="text-caption text-muted">{company.industry}</span>
                    </div>
                  </div>
                  <div className="text-h3 text-primary font-bold">{formatCompactNumber(company.avgTC)}</div>
                  <p className="text-caption text-muted mt-1">Avg. Total Compensation</p>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
                    <span className="text-caption text-muted">{company._count.salaries} salaries</span>
                    <span className="text-caption text-muted">•</span>
                    <span className="text-caption text-muted">{company._count.reviews} reviews</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Workplace Rankings */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-h2 text-heading">🏆 Workplace Rankings</h2>
              <p className="text-body text-muted mt-1">Top companies rated by workplace quality</p>
            </div>
            <Link href="/workplace-index" className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors">
              Full rankings →
            </Link>
          </div>
          <Card>
            <div className="divide-y divide-border">
              {data.rankings.map((rank, idx) => (
                <Link key={rank.id} href={`/companies/${rank.company.slug}`} className="flex items-center gap-4 py-4 px-2 hover:bg-surface-secondary rounded-lg transition-colors -mx-2">
                  <span className="text-h3 text-muted w-8 text-center font-bold">{idx + 1}</span>
                  <CompanyAvatar name={rank.company.name} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-body font-semibold text-heading truncate">{rank.company.name}</h3>
                    <span className="text-caption text-muted">{rank.company.industry}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-h4 text-heading font-bold">{rank.overallScore.toFixed(1)}</div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <svg key={i} className="w-3 h-3" viewBox="0 0 24 24" fill={i < Math.round(rank.overallScore) ? '#FFB400' : '#EBEBEB'} stroke="none">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Recent Reviews & Interviews */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Reviews */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-h3 text-heading">Latest Reviews</h2>
                <Link href="/reviews" className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors">View all →</Link>
              </div>
              <div className="space-y-4 stagger-children">
                {data.recentReviews.map((review) => (
                  <Card key={review.id} hover padding="sm">
                    <div className="flex items-start justify-between mb-2">
                      <Link href={`/companies/${review.company.slug}`} className="text-body-sm font-semibold text-primary hover:underline">
                        {review.company.name}
                      </Link>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#FFB400" stroke="none">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        <span className="text-body-sm font-semibold text-heading">{review.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <h3 className="text-body font-medium text-heading mb-1.5">{review.title}</h3>
                    <p className="text-body-sm text-success line-clamp-2 mb-1">
                      <strong>Pros:</strong> {review.pros}
                    </p>
                    <p className="text-body-sm text-danger line-clamp-2">
                      <strong>Cons:</strong> {review.cons}
                    </p>
                  </Card>
                ))}
              </div>
            </div>

            {/* Interviews */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-h3 text-heading">Latest Interviews</h2>
                <Link href="/interviews" className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors">View all →</Link>
              </div>
              <div className="space-y-4 stagger-children">
                {data.recentInterviews.map((interview) => (
                  <Card key={interview.id} hover padding="sm">
                    <div className="flex items-start justify-between mb-2">
                      <Link href={`/companies/${interview.company.slug}`} className="text-body-sm font-semibold text-primary hover:underline">
                        {interview.company.name}
                      </Link>
                      <DifficultyBadge difficulty={interview.difficulty} />
                    </div>
                    <h3 className="text-body font-medium text-heading mb-1">{interview.role}</h3>
                    <p className="text-body-sm text-muted line-clamp-2 mb-2">{interview.questions}</p>
                    <div className="flex items-center gap-3">
                      <ResultBadge result={interview.result} />
                      <span className="text-caption text-muted">{interview.rounds} rounds</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="gradient-primary rounded-3xl p-10 sm:p-16 text-center">
            <h2 className="text-h1 text-white mb-4">Help fellow professionals make better decisions</h2>
            <p className="text-body-lg text-white/80 mb-8 max-w-xl mx-auto">
              Anonymously share your salary, review, or interview experience. Every contribution helps someone negotiate better.
            </p>
            <Link
              href="/contribute"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary font-semibold rounded-xl hover:bg-white/90 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              Contribute Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Sub Components ─────────────────────────────────────────
function StatCounter({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-border">
      <div className="text-h2 text-heading font-bold">{formatCompactNumber(value)}</div>
      <div className="text-caption text-muted mt-0.5">{label}</div>
    </div>
  );
}

function CompanyAvatar({ name }: { name: string }) {
  const colors = [
    'bg-red-100 text-red-700', 'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700',
    'bg-purple-100 text-purple-700', 'bg-amber-100 text-amber-700', 'bg-cyan-100 text-cyan-700',
  ];
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${colors[idx]}`}>
      {initials}
    </div>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors: Record<string, string> = {
    Easy: 'bg-success-light text-success',
    Medium: 'bg-warning-light text-warning',
    Hard: 'bg-danger-light text-danger',
    'Very Hard': 'bg-danger-light text-danger',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[difficulty] || ''}`}>{difficulty}</span>;
}

function ResultBadge({ result }: { result: string }) {
  const colors: Record<string, string> = {
    Selected: 'text-success',
    Rejected: 'text-danger',
    'No Response': 'text-muted',
    Ghosted: 'text-warning',
  };
  return <span className={`text-caption font-semibold ${colors[result] || 'text-muted'}`}>{result}</span>;
}
