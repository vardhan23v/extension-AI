'use client';

import React from 'react';
import { Card, Select, Badge } from '@/components/ui';
import { formatCurrency, formatCompactNumber } from '@/lib/utils';

interface CompanyData {
  name: string;
  slug: string;
  industry: string;
  headquarters: string;
  headcountRange: string;
  workplaceIndex: { overallScore: number; cultureScore: number; compensationScore: number; growthScore: number; diversityScore: number; remoteScore: number } | null;
  salary: { count: number; avgTC: number; avgBase: number; avgBonus: number; avgStock: number; minTC: number; maxTC: number };
  review: { count: number; avgRating: number; avgWLB: number; avgCulture: number; avgGrowth: number; avgCompensation: number };
  interviewCount: number;
  salaryByLevel: { level: string; avgTC: number; count: number }[];
}

const COMPANIES = [
  { value: 'google', label: 'Google' }, { value: 'amazon', label: 'Amazon' }, { value: 'meta', label: 'Meta' },
  { value: 'microsoft', label: 'Microsoft' }, { value: 'nvidia', label: 'NVIDIA' }, { value: 'apple', label: 'Apple' },
  { value: 'flipkart', label: 'Flipkart' }, { value: 'razorpay', label: 'Razorpay' }, { value: 'meesho', label: 'Meesho' },
  { value: 'zepto', label: 'Zepto' }, { value: 'tcs', label: 'TCS' }, { value: 'infosys', label: 'Infosys' },
  { value: 'wipro', label: 'Wipro' }, { value: 'accenture', label: 'Accenture' }, { value: 'deloitte', label: 'Deloitte' },
];

export default function ComparePage() {
  const [slugA, setSlugA] = React.useState('google');
  const [slugB, setSlugB] = React.useState('amazon');
  const [data, setData] = React.useState<{ companyA: CompanyData; companyB: CompanyData } | null>(null);
  const [loading, setLoading] = React.useState(false);

  const fetchComparison = React.useCallback(async () => {
    if (!slugA || !slugB || slugA === slugB) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/compare?a=${slugA}&b=${slugB}`);
      const json = await res.json();
      setData(json.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [slugA, slugB]);

  React.useEffect(() => { fetchComparison(); }, [fetchComparison]);

  const swap = () => { setSlugA(slugB); setSlugB(slugA); };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-h1 text-heading">Compare Companies</h1>
        <p className="text-body text-muted mt-1">Side-by-side comparison of compensation, culture, and workplace quality</p>
      </div>

      {/* Selectors */}
      <Card className="mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Select value={slugA} onChange={(e) => setSlugA(e.target.value)} options={COMPANIES} label="Company A" className="flex-1 w-full" />
          <button onClick={swap} className="p-2 rounded-full bg-surface-secondary hover:bg-surface-tertiary transition-colors shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 16l-4-4 4-4M17 8l4 4-4 4M3 12h18"/></svg>
          </button>
          <Select value={slugB} onChange={(e) => setSlugB(e.target.value)} options={COMPANIES} label="Company B" className="flex-1 w-full" />
        </div>
      </Card>

      {loading && <div className="text-center py-16"><div className="animate-shimmer w-full h-80 rounded-xl" /></div>}

      {data && !loading && (
        <div className="space-y-6 stagger-children">
          {/* Overview */}
          <div className="grid grid-cols-3 gap-4">
            <div />
            <Card className="text-center"><CompanyHeader c={data.companyA} /></Card>
            <Card className="text-center"><CompanyHeader c={data.companyB} /></Card>
          </div>

          {/* Compensation */}
          <Card>
            <h2 className="text-h3 text-heading mb-4">💰 Compensation</h2>
            <CompareRow label="Avg Total Comp" a={formatCurrency(data.companyA.salary.avgTC)} b={formatCurrency(data.companyB.salary.avgTC)} winA={data.companyA.salary.avgTC > data.companyB.salary.avgTC} />
            <CompareRow label="Avg Base" a={formatCurrency(data.companyA.salary.avgBase)} b={formatCurrency(data.companyB.salary.avgBase)} winA={data.companyA.salary.avgBase > data.companyB.salary.avgBase} />
            <CompareRow label="Avg Bonus" a={formatCurrency(data.companyA.salary.avgBonus)} b={formatCurrency(data.companyB.salary.avgBonus)} winA={data.companyA.salary.avgBonus > data.companyB.salary.avgBonus} />
            <CompareRow label="Avg Stock" a={formatCurrency(data.companyA.salary.avgStock)} b={formatCurrency(data.companyB.salary.avgStock)} winA={data.companyA.salary.avgStock > data.companyB.salary.avgStock} />
            <CompareRow label="Data Points" a={data.companyA.salary.count.toString()} b={data.companyB.salary.count.toString()} />
          </Card>

          {/* Workplace */}
          <Card>
            <h2 className="text-h3 text-heading mb-4">🏢 Workplace Quality</h2>
            <CompareRow label="Overall Rating" a={data.companyA.review.avgRating.toFixed(1)} b={data.companyB.review.avgRating.toFixed(1)} winA={data.companyA.review.avgRating > data.companyB.review.avgRating} />
            <CompareRow label="Work-Life Balance" a={data.companyA.review.avgWLB.toFixed(1)} b={data.companyB.review.avgWLB.toFixed(1)} winA={data.companyA.review.avgWLB > data.companyB.review.avgWLB} />
            <CompareRow label="Culture" a={data.companyA.review.avgCulture.toFixed(1)} b={data.companyB.review.avgCulture.toFixed(1)} winA={data.companyA.review.avgCulture > data.companyB.review.avgCulture} />
            <CompareRow label="Growth" a={data.companyA.review.avgGrowth.toFixed(1)} b={data.companyB.review.avgGrowth.toFixed(1)} winA={data.companyA.review.avgGrowth > data.companyB.review.avgGrowth} />
            <CompareRow label="Compensation Rating" a={data.companyA.review.avgCompensation.toFixed(1)} b={data.companyB.review.avgCompensation.toFixed(1)} winA={data.companyA.review.avgCompensation > data.companyB.review.avgCompensation} />
          </Card>

          {/* WPI */}
          {data.companyA.workplaceIndex && data.companyB.workplaceIndex && (
            <Card>
              <h2 className="text-h3 text-heading mb-4">🏆 Workplace Index</h2>
              <CompareRow label="Overall WPI" a={data.companyA.workplaceIndex.overallScore.toFixed(1)} b={data.companyB.workplaceIndex.overallScore.toFixed(1)} winA={data.companyA.workplaceIndex.overallScore > data.companyB.workplaceIndex.overallScore} />
              <CompareRow label="Culture Score" a={data.companyA.workplaceIndex.cultureScore.toFixed(1)} b={data.companyB.workplaceIndex.cultureScore.toFixed(1)} winA={data.companyA.workplaceIndex.cultureScore > data.companyB.workplaceIndex.cultureScore} />
              <CompareRow label="Diversity Score" a={data.companyA.workplaceIndex.diversityScore.toFixed(1)} b={data.companyB.workplaceIndex.diversityScore.toFixed(1)} winA={data.companyA.workplaceIndex.diversityScore > data.companyB.workplaceIndex.diversityScore} />
              <CompareRow label="Remote Score" a={data.companyA.workplaceIndex.remoteScore.toFixed(1)} b={data.companyB.workplaceIndex.remoteScore.toFixed(1)} winA={data.companyA.workplaceIndex.remoteScore > data.companyB.workplaceIndex.remoteScore} />
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function CompanyHeader({ c }: { c: CompanyData }) {
  const colors = ['bg-red-100 text-red-700', 'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-purple-100 text-purple-700', 'bg-amber-100 text-amber-700', 'bg-cyan-100 text-cyan-700'];
  const idx = c.name.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0) % colors.length;
  const initials = c.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold ${colors[idx]}`}>{initials}</div>
      <h3 className="text-h4 text-heading">{c.name}</h3>
      <Badge variant="default" size="sm">{c.industry}</Badge>
    </div>
  );
}

function CompareRow({ label, a, b, winA }: { label: string; a: string; b: string; winA?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-3 border-b border-border last:border-0 items-center">
      <span className="text-body-sm text-muted font-medium">{label}</span>
      <span className={`text-body-sm text-center font-semibold ${winA === true ? 'text-success' : winA === false ? 'text-body' : 'text-heading'}`}>
        {a} {winA === true && '🏆'}
      </span>
      <span className={`text-body-sm text-center font-semibold ${winA === false ? 'text-success' : winA === true ? 'text-body' : 'text-heading'}`}>
        {b} {winA === false && '🏆'}
      </span>
    </div>
  );
}
