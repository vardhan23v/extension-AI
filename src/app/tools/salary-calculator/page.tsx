'use client';

import React from 'react';
import { Card, Input, Button } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';

export default function SalaryCalculatorPage() {
  const [ctc, setCtc] = React.useState(2000000);
  const [bonus, setBonus] = React.useState(0);

  const basicSalary = ctc * 0.4;
  const hra = basicSalary * 0.5;
  const pf = Math.min(basicSalary * 0.12, 21600 * 12);
  const professionalTax = 2400;
  const specialAllowance = ctc - basicSalary - hra - pf - bonus;
  const grossMonthly = (ctc - bonus) / 12;
  const pfMonthly = pf / 12;
  const ptMonthly = professionalTax / 12;
  const taxableIncome = ctc - pf - 50000; // Standard deduction
  const tax = calculateTax(taxableIncome);
  const taxMonthly = tax / 12;
  const inHandMonthly = grossMonthly - pfMonthly - ptMonthly - taxMonthly;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <h1 className="text-h1 text-heading mb-2">Salary Calculator</h1>
      <p className="text-body text-muted mb-8">Break down your CTC into monthly in-hand salary</p>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-h3 text-heading mb-4">Enter Details</h2>
          <div className="space-y-4">
            <Input label="Annual CTC (₹)" type="number" value={ctc} onChange={e => setCtc(Number(e.target.value))} min={0} />
            <Input label="Annual Bonus (₹)" type="number" value={bonus} onChange={e => setBonus(Number(e.target.value))} min={0} />
          </div>
        </Card>

        <Card className="bg-surface-secondary border-0">
          <h2 className="text-h3 text-heading mb-4">Monthly Breakdown</h2>
          <div className="space-y-3">
            <Row label="Gross Salary" value={grossMonthly} />
            <Row label="Basic Salary" value={basicSalary / 12} />
            <Row label="HRA" value={hra / 12} />
            <Row label="Special Allowance" value={Math.max(0, specialAllowance / 12)} />
            <div className="border-t border-border pt-3 mt-3">
              <Row label="PF Deduction" value={-pfMonthly} negative />
              <Row label="Professional Tax" value={-ptMonthly} negative />
              <Row label="Income Tax" value={-taxMonthly} negative />
            </div>
            <div className="border-t-2 border-primary pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-h4 text-heading">In-Hand Salary</span>
                <span className="text-h3 text-primary font-bold">{formatCurrency(Math.round(inHandMonthly))}</span>
              </div>
              <p className="text-caption text-muted mt-1">
                Annual In-Hand: {formatCurrency(Math.round(inHandMonthly * 12))}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, negative }: { label: string; value: number; negative?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-body-sm text-muted">{label}</span>
      <span className={`text-body-sm font-semibold ${negative ? 'text-danger' : 'text-heading'}`}>
        {negative ? '- ' : ''}{formatCurrency(Math.abs(Math.round(value)))}
      </span>
    </div>
  );
}

function calculateTax(taxableIncome: number): number {
  // New regime FY 2024-25
  if (taxableIncome <= 300000) return 0;
  let tax = 0;
  const slabs = [
    { limit: 300000, rate: 0 },
    { limit: 700000, rate: 0.05 },
    { limit: 1000000, rate: 0.10 },
    { limit: 1200000, rate: 0.15 },
    { limit: 1500000, rate: 0.20 },
    { limit: Infinity, rate: 0.30 },
  ];
  let remaining = taxableIncome;
  let prevLimit = 0;
  for (const slab of slabs) {
    const taxable = Math.min(remaining, slab.limit - prevLimit);
    if (taxable <= 0) break;
    tax += taxable * slab.rate;
    remaining -= taxable;
    prevLimit = slab.limit;
  }
  tax += tax * 0.04; // Cess
  return tax;
}
