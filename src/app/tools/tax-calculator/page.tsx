'use client';

import React from 'react';
import { Card, Input, Select } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';

export default function TaxCalculatorPage() {
  const [income, setIncome] = React.useState(2000000);
  const [regime, setRegime] = React.useState<'new' | 'old'>('new');

  const taxNew = calculateNewRegimeTax(income);
  const taxOld = calculateOldRegimeTax(income);
  const selectedTax = regime === 'new' ? taxNew : taxOld;
  const effectiveRate = income > 0 ? (selectedTax / income) * 100 : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <h1 className="text-h1 text-heading mb-2">Tax Calculator</h1>
      <p className="text-body text-muted mb-8">Calculate your income tax under old and new regime</p>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-h3 text-heading mb-4">Income Details</h2>
          <div className="space-y-4">
            <Input label="Annual Taxable Income (₹)" type="number" value={income} onChange={e => setIncome(Number(e.target.value))} min={0} />
            <Select label="Tax Regime" value={regime} onChange={e => setRegime(e.target.value as 'new' | 'old')} options={[
              { value: 'new', label: 'New Regime (FY 2024-25)' },
              { value: 'old', label: 'Old Regime' },
            ]} />
          </div>
        </Card>

        <Card className="bg-surface-secondary border-0">
          <h2 className="text-h3 text-heading mb-4">Tax Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-body-sm text-muted">Taxable Income</span><span className="text-body-sm font-semibold text-heading">{formatCurrency(income)}</span></div>
            <div className="flex justify-between"><span className="text-body-sm text-muted">Tax (before cess)</span><span className="text-body-sm font-semibold text-heading">{formatCurrency(Math.round(selectedTax / 1.04))}</span></div>
            <div className="flex justify-between"><span className="text-body-sm text-muted">Health & Education Cess (4%)</span><span className="text-body-sm font-semibold text-heading">{formatCurrency(Math.round(selectedTax - selectedTax / 1.04))}</span></div>
            <div className="border-t-2 border-primary pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-h4 text-heading">Total Tax</span>
                <span className="text-h3 text-danger font-bold">{formatCurrency(Math.round(selectedTax))}</span>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-caption text-muted">Effective Tax Rate</span>
                <span className="text-body-sm font-semibold text-heading">{effectiveRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-caption text-muted">Post-Tax Income</span>
                <span className="text-body-sm font-semibold text-success">{formatCurrency(Math.round(income - selectedTax))}</span>
              </div>
            </div>
          </div>

          {/* Comparison */}
          <div className="mt-6 p-3 bg-white rounded-lg">
            <p className="text-caption text-muted mb-2 font-semibold">Regime Comparison</p>
            <div className="flex justify-between text-body-sm">
              <span>New Regime Tax</span>
              <span className={`font-semibold ${taxNew <= taxOld ? 'text-success' : 'text-heading'}`}>
                {formatCurrency(Math.round(taxNew))} {taxNew <= taxOld && '✅'}
              </span>
            </div>
            <div className="flex justify-between text-body-sm mt-1">
              <span>Old Regime Tax</span>
              <span className={`font-semibold ${taxOld < taxNew ? 'text-success' : 'text-heading'}`}>
                {formatCurrency(Math.round(taxOld))} {taxOld < taxNew && '✅'}
              </span>
            </div>
            <p className="text-caption text-muted mt-2">
              💡 You save {formatCurrency(Math.abs(Math.round(taxNew - taxOld)))} with the {taxNew <= taxOld ? 'New' : 'Old'} regime
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function calculateNewRegimeTax(income: number): number {
  const slabs = [
    { limit: 300000, rate: 0 }, { limit: 700000, rate: 0.05 }, { limit: 1000000, rate: 0.10 },
    { limit: 1200000, rate: 0.15 }, { limit: 1500000, rate: 0.20 }, { limit: Infinity, rate: 0.30 },
  ];
  let tax = 0, remaining = income, prevLimit = 0;
  for (const slab of slabs) {
    const taxable = Math.min(remaining, slab.limit - prevLimit);
    if (taxable <= 0) break;
    tax += taxable * slab.rate;
    remaining -= taxable;
    prevLimit = slab.limit;
  }
  return tax * 1.04;
}

function calculateOldRegimeTax(income: number): number {
  const taxable = income - 150000; // Basic deductions 80C
  const slabs = [
    { limit: 250000, rate: 0 }, { limit: 500000, rate: 0.05 },
    { limit: 1000000, rate: 0.20 }, { limit: Infinity, rate: 0.30 },
  ];
  let tax = 0, remaining = Math.max(0, taxable), prevLimit = 0;
  for (const slab of slabs) {
    const t = Math.min(remaining, slab.limit - prevLimit);
    if (t <= 0) break;
    tax += t * slab.rate;
    remaining -= t;
    prevLimit = slab.limit;
  }
  return tax * 1.04;
}
