'use client';

import React from 'react';
import Link from 'next/link';
import { Card, Badge, Select, Input, Pagination } from '@/components/ui';
import { formatCurrency, formatCompactNumber, LEVELS, LEVEL_LABELS, LOCATIONS } from '@/lib/utils';
import { useFilterStore } from '@/stores';

interface Salary {
  id: string;
  role: string;
  level: string;
  location: string;
  experienceYears: number;
  baseSalary: number;
  bonus: number;
  stock: number;
  totalCompensation: number;
  isVerified: boolean;
  submittedAt: string;
  company: { name: string; slug: string; logoUrl: string | null };
}

export default function SalariesPage() {
  const [salaries, setSalaries] = React.useState<Salary[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const { filters, setFilter } = useFilterStore();

  const fetchSalaries = React.useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.role) params.set('role', filters.role);
    if (filters.level) params.set('level', filters.level);
    if (filters.location) params.set('location', filters.location);
    params.set('sortBy', filters.sortBy);
    params.set('sortOrder', filters.sortOrder);
    params.set('page', page.toString());
    params.set('limit', '20');

    try {
      const res = await fetch(`/api/salaries?${params}`);
      const json = await res.json();
      setSalaries(json.data || []);
      setTotal(json.pagination?.totalPages || 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  React.useEffect(() => {
    fetchSalaries();
  }, [fetchSalaries]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-h1 text-heading">Salary Explorer</h1>
        <p className="text-body text-muted mt-1">Browse and filter compensation data from tech companies across India</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            placeholder="Filter by role..."
            value={filters.role}
            onChange={(e) => setFilter('role', e.target.value)}
            icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>}
          />
          <Select
            value={filters.level}
            onChange={(e) => setFilter('level', e.target.value)}
            placeholder="All Levels"
            options={[{ value: '', label: 'All Levels' }, ...LEVELS.map((l) => ({ value: l, label: LEVEL_LABELS[l] || l }))]}
          />
          <Select
            value={filters.location}
            onChange={(e) => setFilter('location', e.target.value)}
            placeholder="All Locations"
            options={[{ value: '', label: 'All Locations' }, ...LOCATIONS.map((l) => ({ value: l, label: l }))]}
          />
          <Select
            value={filters.sortBy}
            onChange={(e) => setFilter('sortBy', e.target.value)}
            options={[
              { value: 'totalCompensation', label: 'Total Compensation' },
              { value: 'baseSalary', label: 'Base Salary' },
              { value: 'experienceYears', label: 'Experience' },
              { value: 'submittedAt', label: 'Most Recent' },
            ]}
          />
        </div>
      </Card>

      {/* Salary Table */}
      <Card padding="sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-caption text-muted font-semibold uppercase tracking-wider p-4">Company</th>
                <th className="text-left text-caption text-muted font-semibold uppercase tracking-wider p-4">Role</th>
                <th className="text-left text-caption text-muted font-semibold uppercase tracking-wider p-4">Level</th>
                <th className="text-left text-caption text-muted font-semibold uppercase tracking-wider p-4 hidden sm:table-cell">Location</th>
                <th className="text-left text-caption text-muted font-semibold uppercase tracking-wider p-4 hidden md:table-cell">YOE</th>
                <th className="text-right text-caption text-muted font-semibold uppercase tracking-wider p-4">Base</th>
                <th className="text-right text-caption text-muted font-semibold uppercase tracking-wider p-4 hidden lg:table-cell">Bonus</th>
                <th className="text-right text-caption text-muted font-semibold uppercase tracking-wider p-4 hidden lg:table-cell">Stock</th>
                <th className="text-right text-caption text-muted font-semibold uppercase tracking-wider p-4">Total TC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}><td colSpan={9} className="p-4"><div className="h-6 animate-shimmer rounded" /></td></tr>
                ))
              ) : salaries.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-muted">No salary records found matching your filters.</td></tr>
              ) : (
                salaries.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-secondary transition-colors">
                    <td className="p-4">
                      <Link href={`/companies/${s.company.slug}`} className="text-body-sm font-semibold text-primary hover:underline">
                        {s.company.name}
                      </Link>
                    </td>
                    <td className="p-4 text-body-sm text-heading">{s.role}</td>
                    <td className="p-4">
                      <Badge variant="primary" size="sm">{LEVEL_LABELS[s.level] || s.level}</Badge>
                    </td>
                    <td className="p-4 text-body-sm text-muted hidden sm:table-cell">{s.location}</td>
                    <td className="p-4 text-body-sm text-muted hidden md:table-cell">{s.experienceYears}y</td>
                    <td className="p-4 text-body-sm text-heading text-right font-medium">{formatCompactNumber(s.baseSalary)}</td>
                    <td className="p-4 text-body-sm text-muted text-right hidden lg:table-cell">{formatCompactNumber(s.bonus)}</td>
                    <td className="p-4 text-body-sm text-muted text-right hidden lg:table-cell">{formatCompactNumber(s.stock)}</td>
                    <td className="p-4 text-right">
                      <span className="text-body font-bold text-heading">{formatCurrency(s.totalCompensation)}</span>
                      {s.isVerified && (
                        <svg className="inline-block ml-1 w-4 h-4 text-success" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-center py-4 border-t border-border">
          <Pagination currentPage={page} totalPages={total} onPageChange={setPage} />
        </div>
      </Card>
    </div>
  );
}
