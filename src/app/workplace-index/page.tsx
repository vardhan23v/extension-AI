import Link from 'next/link';
import prisma from '@/lib/db';
import { Card, Badge } from '@/components/ui';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Workplace Rankings — TalentDash', description: 'Top tech companies ranked by workplace quality, culture, compensation, and growth.' };

async function getRankings() {
  return prisma.workplaceIndex.findMany({
    include: { company: { select: { name: true, slug: true, industry: true, headquarters: true } } },
    orderBy: { overallScore: 'desc' },
  });
}

export default async function WorkplaceIndexPage() {
  const rankings = await getRankings();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-h1 text-heading">🏆 Workplace Rankings</h1>
        <p className="text-body text-muted mt-1">Companies ranked by overall workplace quality index</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left text-caption text-muted font-semibold uppercase tracking-wider p-4 w-12">#</th>
                <th className="text-left text-caption text-muted font-semibold uppercase tracking-wider p-4">Company</th>
                <th className="text-center text-caption text-muted font-semibold uppercase tracking-wider p-4">Overall</th>
                <th className="text-center text-caption text-muted font-semibold uppercase tracking-wider p-4 hidden sm:table-cell">Culture</th>
                <th className="text-center text-caption text-muted font-semibold uppercase tracking-wider p-4 hidden sm:table-cell">Compensation</th>
                <th className="text-center text-caption text-muted font-semibold uppercase tracking-wider p-4 hidden md:table-cell">Growth</th>
                <th className="text-center text-caption text-muted font-semibold uppercase tracking-wider p-4 hidden md:table-cell">Diversity</th>
                <th className="text-center text-caption text-muted font-semibold uppercase tracking-wider p-4 hidden lg:table-cell">Remote</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rankings.map((rank, idx) => (
                <tr key={rank.id} className="hover:bg-surface-secondary transition-colors">
                  <td className="p-4">
                    <span className={`text-h4 font-bold ${idx < 3 ? 'text-primary' : 'text-muted'}`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="p-4">
                    <Link href={`/companies/${rank.company.slug}`} className="flex items-center gap-3 group">
                      <CompanyAvatar name={rank.company.name} />
                      <div>
                        <h3 className="text-body font-semibold text-heading group-hover:text-primary transition-colors">{rank.company.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="default" size="sm">{rank.company.industry}</Badge>
                          <span className="text-caption text-muted">{rank.company.headquarters}</span>
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="p-4 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <ScoreBar score={rank.overallScore} />
                      <span className="text-body font-bold text-heading">{rank.overallScore.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center hidden sm:table-cell"><ScoreCell score={rank.cultureScore} /></td>
                  <td className="p-4 text-center hidden sm:table-cell"><ScoreCell score={rank.compensationScore} /></td>
                  <td className="p-4 text-center hidden md:table-cell"><ScoreCell score={rank.growthScore} /></td>
                  <td className="p-4 text-center hidden md:table-cell"><ScoreCell score={rank.diversityScore} /></td>
                  <td className="p-4 text-center hidden lg:table-cell"><ScoreCell score={rank.remoteScore} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function CompanyAvatar({ name }: { name: string }) {
  const colors = ['bg-red-100 text-red-700', 'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-purple-100 text-purple-700', 'bg-amber-100 text-amber-700', 'bg-cyan-100 text-cyan-700'];
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${colors[idx]}`}>{initials}</div>;
}

function ScoreBar({ score }: { score: number }) {
  const width = (score / 5) * 100;
  const color = score >= 4 ? 'bg-success' : score >= 3 ? 'bg-warning' : 'bg-danger';
  return (
    <div className="w-16 h-2 bg-surface-secondary rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
    </div>
  );
}

function ScoreCell({ score }: { score: number }) {
  const color = score >= 4 ? 'text-success' : score >= 3 ? 'text-heading' : 'text-danger';
  return <span className={`text-body-sm font-semibold ${color}`}>{score.toFixed(1)}</span>;
}
