'use client';

import React from 'react';
import { Card, Button, Input, Select, Tabs } from '@/components/ui';
import { LEVELS, LEVEL_LABELS, LOCATIONS, DIFFICULTIES, INTERVIEW_RESULTS } from '@/lib/utils';

export default function ContributePage() {
  const [activeTab, setActiveTab] = React.useState('salary');
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState('');

  const tabs = [
    { id: 'salary', label: '💰 Salary' },
    { id: 'review', label: '⭐ Review' },
    { id: 'interview', label: '🎯 Interview' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-h1 text-heading">Contribute</h1>
        <p className="text-body text-muted mt-2">Share anonymously. Help others make better career decisions.</p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

      {success && (
        <div className="mb-6 p-4 bg-success-light text-success rounded-xl text-body-sm font-medium animate-slide-down">
          ✅ {success}
        </div>
      )}

      {activeTab === 'salary' && <SalaryForm onSubmitting={setSubmitting} onSuccess={setSuccess} submitting={submitting} />}
      {activeTab === 'review' && <ReviewForm onSubmitting={setSubmitting} onSuccess={setSuccess} submitting={submitting} />}
      {activeTab === 'interview' && <InterviewForm onSubmitting={setSubmitting} onSuccess={setSuccess} submitting={submitting} />}
    </div>
  );
}

function SalaryForm({ onSubmitting, onSuccess, submitting }: { onSubmitting: (v: boolean) => void; onSuccess: (m: string) => void; submitting: boolean }) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onSubmitting(true);
    try {
      const res = await fetch('/api/salaries/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: fd.get('companyId'),
          role: fd.get('role'),
          level: fd.get('level'),
          location: fd.get('location'),
          experienceYears: Number(fd.get('experienceYears')),
          baseSalary: Number(fd.get('baseSalary')),
          bonus: Number(fd.get('bonus') || 0),
          stock: Number(fd.get('stock') || 0),
        }),
      });
      if (res.ok) {
        onSuccess('Salary submitted successfully! It will be reviewed shortly.');
        (e.target as HTMLFormElement).reset();
      }
    } catch (err) { console.error(err); }
    finally { onSubmitting(false); }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input name="companyId" label="Company ID" placeholder="Enter company identifier" required />
        <Input name="role" label="Role" placeholder="e.g. Software Engineer" required />
        <Select name="level" label="Level" options={LEVELS.map(l => ({ value: l, label: LEVEL_LABELS[l] || l }))} required />
        <Select name="location" label="Location" options={LOCATIONS.map(l => ({ value: l, label: l }))} required />
        <Input name="experienceYears" label="Years of Experience" type="number" min={0} max={50} required />
        <div className="grid grid-cols-3 gap-4">
          <Input name="baseSalary" label="Base Salary (₹)" type="number" min={0} required />
          <Input name="bonus" label="Bonus (₹)" type="number" min={0} />
          <Input name="stock" label="Stock/ESOP (₹)" type="number" min={0} />
        </div>
        <Button type="submit" isLoading={submitting} className="w-full" size="lg">Submit Salary</Button>
      </form>
    </Card>
  );
}

function ReviewForm({ onSubmitting, onSuccess, submitting }: { onSubmitting: (v: boolean) => void; onSuccess: (m: string) => void; submitting: boolean }) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: fd.get('companyId'),
          title: fd.get('title'),
          pros: fd.get('pros'),
          cons: fd.get('cons'),
          rating: Number(fd.get('rating')),
          workLifeBalance: Number(fd.get('wlb') || 3),
          culture: Number(fd.get('culture') || 3),
          growth: Number(fd.get('growth') || 3),
          compensation: Number(fd.get('compensation') || 3),
          anonymousRole: fd.get('anonymousRole') || undefined,
        }),
      });
      if (res.ok) {
        onSuccess('Review submitted! It will be reviewed before publishing.');
        (e.target as HTMLFormElement).reset();
      }
    } catch (err) { console.error(err); }
    finally { onSubmitting(false); }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input name="companyId" label="Company ID" placeholder="Enter company identifier" required />
        <Input name="title" label="Review Title" placeholder="e.g. Great place to work" required />
        <div>
          <label className="text-body-sm font-medium text-heading block mb-1.5">Pros</label>
          <textarea name="pros" className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-heading placeholder:text-muted transition-all hover:border-border-hover focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none min-h-[80px]" placeholder="What did you like?" required />
        </div>
        <div>
          <label className="text-body-sm font-medium text-heading block mb-1.5">Cons</label>
          <textarea name="cons" className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-heading placeholder:text-muted transition-all hover:border-border-hover focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none min-h-[80px]" placeholder="What could be improved?" required />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Input name="rating" label="Overall" type="number" min={1} max={5} step={0.1} required />
          <Input name="wlb" label="WLB" type="number" min={1} max={5} step={0.1} />
          <Input name="culture" label="Culture" type="number" min={1} max={5} step={0.1} />
          <Input name="growth" label="Growth" type="number" min={1} max={5} step={0.1} />
          <Input name="compensation" label="Comp" type="number" min={1} max={5} step={0.1} />
        </div>
        <Input name="anonymousRole" label="Your Role (optional)" placeholder="e.g. SDE-II" />
        <Button type="submit" isLoading={submitting} className="w-full" size="lg">Submit Review</Button>
      </form>
    </Card>
  );
}

function InterviewForm({ onSubmitting, onSuccess, submitting }: { onSubmitting: (v: boolean) => void; onSuccess: (m: string) => void; submitting: boolean }) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onSubmitting(true);
    try {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: fd.get('companyId'),
          role: fd.get('role'),
          difficulty: fd.get('difficulty'),
          rounds: Number(fd.get('rounds') || 1),
          questions: fd.get('questions'),
          result: fd.get('result'),
          tips: fd.get('tips') || undefined,
        }),
      });
      if (res.ok) {
        onSuccess('Interview experience submitted! Thanks for contributing.');
        (e.target as HTMLFormElement).reset();
      }
    } catch (err) { console.error(err); }
    finally { onSubmitting(false); }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input name="companyId" label="Company ID" placeholder="Enter company identifier" required />
        <Input name="role" label="Role" placeholder="e.g. Software Engineer" required />
        <div className="grid grid-cols-2 gap-4">
          <Select name="difficulty" label="Difficulty" options={DIFFICULTIES.map(d => ({ value: d, label: d }))} required />
          <Select name="result" label="Result" options={INTERVIEW_RESULTS.map(r => ({ value: r, label: r }))} required />
        </div>
        <Input name="rounds" label="Number of Rounds" type="number" min={1} max={20} />
        <div>
          <label className="text-body-sm font-medium text-heading block mb-1.5">Questions Asked</label>
          <textarea name="questions" className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-heading placeholder:text-muted transition-all hover:border-border-hover focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none min-h-[100px]" placeholder="Describe the questions asked..." required />
        </div>
        <div>
          <label className="text-body-sm font-medium text-heading block mb-1.5">Tips (optional)</label>
          <textarea name="tips" className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-heading placeholder:text-muted transition-all hover:border-border-hover focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none min-h-[60px]" placeholder="Any tips for future candidates?" />
        </div>
        <Button type="submit" isLoading={submitting} className="w-full" size="lg">Submit Experience</Button>
      </form>
    </Card>
  );
}
