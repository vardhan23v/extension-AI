import Link from 'next/link';
import prisma from '@/lib/db';
import { formatCompactNumber } from '@/lib/utils';
import { Card, Badge } from '@/components/ui';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Companies — TalentDash',
  description: 'Research top tech companies in India. Compare compensation, culture, and workplace scores.',
};

async function getCompanies() {
  const companies = await prisma.company.findMany({
    include: {
      _count: { select: { salaries: true, reviews: true, interviews: true } },
      workplaceIndex: { select: { overallScore: true } },
    },
    orderBy: { name: 'asc' },
  });

  const withStats = await Promise.all(
    companies.map(async (c) => {
      const stats = await prisma.salary.aggregate({
        where: { companyId: c.id },
        _avg: { totalCompensation: true },
      });
      const reviewStats = await prisma.review.aggregate({
        where: { companyId: c.id, isApproved: true },
        _avg: { rating: true },
      });
      return {
        ...c,
        avgTC: Math.round(stats._avg.totalCompensation || 0),
        avgRating: Math.round((reviewStats._avg.rating || 0) * 10) / 10,
      };
    })
  );

  return withStats;
}

export default async function CompaniesPage() {
  const companies = await getCompanies();
  const industries = [...new Set(companies.map(c => c.industry))].sort();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-h1 text-heading">Companies</h1>
        <p className="text-body text-muted mt-1">Research {companies.length} top tech companies in India</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <Badge variant="primary" size="md">All ({companies.length})</Badge>
        {industries.map(ind => (
          <Badge key={ind} variant="outline" size="md">{ind} ({companies.filter(c => c.industry === ind).length})</Badge>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
        {companies.map((company) => (
          <Link key={company.id} href={`/companies/${company.slug}`}>
            <Card hover className="h-full">
              <div className="flex items-start gap-3 mb-4">
                <CompanyAvatar name={company.name} />
                <div className="flex-1 min-w-0">
                  <h3 className="text-h4 text-heading truncate">{company.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="default" size="sm">{company.industry}</Badge>
                    <span className="text-caption text-muted">{company.headquarters}</span>
                  </div>
                </div>
              </div>
              {company.description && <p className="text-body-sm text-muted line-clamp-2 mb-4">{company.description}</p>}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
                <div>
                  <div className="text-body font-bold text-heading">{formatCompactNumber(company.avgTC)}</div>
                  <div className="text-caption text-muted">Avg TC</div>
                </div>
                <div>
                  <div className="text-body font-bold text-heading flex items-center gap-1">
                    {company.avgRating > 0 ? company.avgRating : '—'}
                    {company.avgRating > 0 && <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="#FFB400" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>}
                  </div>
                  <div className="text-caption text-muted">Rating</div>
                </div>
                <div>
                  <div className="text-body font-bold text-heading">{company.workplaceIndex?.overallScore?.toFixed(1) || '—'}</div>
                  <div className="text-caption text-muted">WPI</div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 text-caption text-muted">
                <span>{company._count.salaries} salaries</span>
                <span>{company._count.reviews} reviews</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function CompanyAvatar({ name }: { name: string }) {
  const colors = ['bg-red-100 text-red-700', 'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-purple-100 text-purple-700', 'bg-amber-100 text-amber-700', 'bg-cyan-100 text-cyan-700'];
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${colors[idx]}`}>{initials}</div>;
}
