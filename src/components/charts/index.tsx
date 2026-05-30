'use client';

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, Legend,
} from 'recharts';
import { formatCompactNumber } from '@/lib/utils';

const COLORS = ['#FF5A5F', '#484848', '#008A05', '#FFB400', '#6366F1', '#EC4899', '#14B8A6', '#F97316'];

// ─── Custom Tooltip ─────────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-xl shadow-lg p-3 min-w-[140px]">
      <p className="text-caption text-muted mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-body-sm">
            <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="text-body-sm font-semibold text-heading">
            {formatCompactNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Salary By Level Chart ──────────────────────────────────
interface SalaryByLevelProps {
  data: { level: string; median: number; p25: number; p75: number }[];
  height?: number;
}

export function SalaryByLevelChart({ data, height = 350 }: SalaryByLevelProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EBEBEB" vertical={false} />
        <XAxis dataKey="level" tick={{ fontSize: 12, fill: '#717171' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#717171' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompactNumber(v)} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="p25" fill="#EBEBEB" radius={[4, 4, 0, 0]} name="P25" />
        <Bar dataKey="median" fill="#FF5A5F" radius={[4, 4, 0, 0]} name="Median" />
        <Bar dataKey="p75" fill="#484848" radius={[4, 4, 0, 0]} name="P75" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Compensation Trend Chart ───────────────────────────────
interface CompTrendProps {
  data: { period: string; median: number; average: number }[];
  height?: number;
}

export function CompensationTrendChart({ data, height = 300 }: CompTrendProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EBEBEB" vertical={false} />
        <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#717171' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#717171' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompactNumber(v)} />
        <Tooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="median" stroke="#FF5A5F" strokeWidth={2.5} dot={{ fill: '#FF5A5F', r: 4 }} name="Median" />
        <Line type="monotone" dataKey="average" stroke="#484848" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Average" />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Rating Breakdown Chart ─────────────────────────────────
interface RatingBreakdownProps {
  data: { category: string; score: number }[];
  height?: number;
}

export function RatingBreakdownChart({ data, height = 300 }: RatingBreakdownProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
        <PolarGrid stroke="#EBEBEB" />
        <PolarAngleAxis dataKey="category" tick={{ fontSize: 12, fill: '#484848' }} />
        <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10, fill: '#717171' }} />
        <Radar dataKey="score" stroke="#FF5A5F" fill="#FF5A5F" fillOpacity={0.15} strokeWidth={2} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ─── Distribution Pie Chart ─────────────────────────────────
interface DistributionProps {
  data: { name: string; value: number }[];
  height?: number;
}

export function DistributionChart({ data, height = 280 }: DistributionProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
          stroke="none"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value: string) => <span className="text-body-sm text-body">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── Salary By Location Chart ───────────────────────────────
interface SalaryByLocationProps {
  data: { location: string; median: number; count: number }[];
  height?: number;
}

export function SalaryByLocationChart({ data, height = 350 }: SalaryByLocationProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EBEBEB" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 12, fill: '#717171' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompactNumber(v)} />
        <YAxis type="category" dataKey="location" tick={{ fontSize: 12, fill: '#484848' }} axisLine={false} tickLine={false} width={100} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="median" fill="#FF5A5F" radius={[0, 6, 6, 0]} name="Median TC" barSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Percentile Chart ───────────────────────────────────────
interface PercentileProps {
  p25: number;
  median: number;
  p75: number;
  p90: number;
  highlight?: number;
}

export function PercentileChart({ p25, median, p75, p90, highlight }: PercentileProps) {
  const max = p90 * 1.15;
  const getPercent = (v: number) => (v / max) * 100;

  return (
    <div className="space-y-3">
      <div className="relative h-8 bg-surface-secondary rounded-full overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-surface-tertiary rounded-full" style={{ width: `${getPercent(p25)}%` }} />
        <div className="absolute inset-y-0 left-0 bg-primary/20 rounded-full" style={{ width: `${getPercent(p75)}%` }} />
        <div className="absolute inset-y-0 left-0 gradient-primary rounded-full" style={{ width: `${getPercent(median)}%` }} />
        {highlight && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-heading z-10"
            style={{ left: `${Math.min(getPercent(highlight), 100)}%` }}
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold bg-heading text-white px-2 py-0.5 rounded">
              You
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-between text-caption text-muted">
        <span>P25: {formatCompactNumber(p25)}</span>
        <span className="font-semibold text-primary">Median: {formatCompactNumber(median)}</span>
        <span>P75: {formatCompactNumber(p75)}</span>
        <span>P90: {formatCompactNumber(p90)}</span>
      </div>
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, change, icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-border p-5 hover:shadow-card-hover transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <span className="text-caption text-muted uppercase tracking-wider font-medium">{label}</span>
        {icon && <span className="text-muted">{icon}</span>}
      </div>
      <div className="text-h2 text-heading font-bold">{value}</div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-body-sm font-medium ${change >= 0 ? 'text-success' : 'text-danger'}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d={change >= 0 ? 'M7 17l5-5 5 5' : 'M7 7l5 5 5-5'} />
          </svg>
          {Math.abs(change)}% vs last quarter
        </div>
      )}
    </div>
  );
}
