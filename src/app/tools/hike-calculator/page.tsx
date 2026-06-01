'use client';

import React from 'react';
import { Card, Input } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';

export default function HikeCalculatorPage() {
  const [current, setCurrent] = React.useState(1500000);
  const [offered, setOffered] = React.useState(2200000);

  const hike = current > 0 ? ((offered - current) / current) * 100 : 0;
  const diff = offered - current;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <h1 className="text-h1 text-heading mb-2">Hike Calculator</h1>
      <p className="text-body text-muted mb-8">Calculate your salary hike percentage</p>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-h3 text-heading mb-4">Enter Salaries</h2>
          <div className="space-y-4">
            <Input label="Current CTC (₹)" type="number" value={current} onChange={e => setCurrent(Number(e.target.value))} min={0} />
            <Input label="Offered CTC (₹)" type="number" value={offered} onChange={e => setOffered(Number(e.target.value))} min={0} />
          </div>
        </Card>

        <Card className="bg-surface-secondary border-0">
          <h2 className="text-h3 text-heading mb-6">Results</h2>
          <div className="text-center mb-6">
            <div className={`text-display font-bold ${hike >= 0 ? 'text-success' : 'text-danger'}`}>
              {hike >= 0 ? '+' : ''}{hike.toFixed(1)}%
            </div>
            <p className="text-body text-muted mt-1">Salary Hike</p>
          </div>
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex justify-between">
              <span className="text-body-sm text-muted">Absolute Increase</span>
              <span className={`text-body-sm font-semibold ${diff >= 0 ? 'text-success' : 'text-danger'}`}>{formatCurrency(diff)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-body-sm text-muted">Monthly Increase</span>
              <span className={`text-body-sm font-semibold ${diff >= 0 ? 'text-success' : 'text-danger'}`}>{formatCurrency(Math.round(diff / 12))}</span>
            </div>
          </div>
          <div className="mt-6 p-3 bg-white rounded-lg">
            <p className="text-caption text-muted">
              💡 Market average hike for tech roles: <strong className="text-heading">15-25%</strong> (job switch), <strong className="text-heading">8-12%</strong> (internal promotion)
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
