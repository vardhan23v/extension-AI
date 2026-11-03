import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutTemplate } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, TEMPLATES } from '../data/templates';
import { Badge, Button, Dialog, EmptyState, Input, PageHeader, Tabs } from '../components/ui';

const LEVEL_TONE = { Beginner: 'success', Intermediate: 'info', Advanced: 'warning' };

const TemplatesPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TEMPLATES.filter((t) => (category === 'all' || t.category === category) && (!q || `${t.title} ${t.description}`.toLowerCase().includes(q)));
  }, [category, query]);

  const use = (t) => {
    if (isAuthenticated) navigate('/new', { state: { prompt: t.prompt } });
    else navigate('/register');
  };

  return (
    <div className={isAuthenticated ? '' : 'mx-auto max-w-6xl px-4 py-10'}>
      <PageHeader title="Templates" description="Starter prompts for common extension types. Pick one, adjust it, and generate." />
      <div className="mb-4 flex flex-col gap-3">
        <div className="relative sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
          <Input type="search" aria-label="Search templates" placeholder="Search templates" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Tabs label="Categories" value={category} onChange={setCategory} tabs={CATEGORIES.map((c) => ({ id: c.id, label: c.label }))} />
      </div>

      {results.length === 0 ? (
        <EmptyState icon={LayoutTemplate} title="No templates match" description="Try another search or category." />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((t) => (
            <li key={t.title} className="flex flex-col rounded-lg border border-border p-4 transition-colors duration-fast hover:bg-surface">
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted">
                  <t.icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <Badge tone={LEVEL_TONE[t.complexity] || 'neutral'}>{t.complexity}</Badge>
              </div>
              <h2 className="mt-3 text-sm font-semibold">{t.title}</h2>
              <p className="mt-1 flex-1 text-[13px] leading-relaxed text-muted">{t.description}</p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="primary" onClick={() => use(t)}>Use template</Button>
                <Button size="sm" variant="ghost" onClick={() => setSelected(t)}>View prompt</Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title}
        description={selected?.description}
        size="lg"
        footer={
          <>
            <Button onClick={() => setSelected(null)}>Close</Button>
            <Button variant="primary" onClick={() => use(selected)}>Use template</Button>
          </>
        }
      >
        <pre className="whitespace-pre-wrap rounded-lg border border-border bg-surface p-3 font-mono text-[12px] leading-relaxed">{selected?.prompt}</pre>
      </Dialog>
    </div>
  );
};

export default TemplatesPage;
