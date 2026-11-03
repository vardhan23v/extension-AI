import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutTemplate } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, TEMPLATES } from '../data/templates';
import { Badge, Button, Dialog, EmptyState, Input, PageHeader, Tabs, staggerStyle } from '../components/ui';

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
        <ul className="grid border-t border-rule md:grid-cols-2 md:gap-x-10">
          {results.map((t, i) => (
            <li key={`${category}-${t.title}`} className="stagger-item flex flex-col gap-3 border-b border-rule py-5 sm:flex-row sm:items-start sm:justify-between" style={staggerStyle(i)}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="text-[15px] font-semibold">{t.title}</h2>
                  <Badge tone={LEVEL_TONE[t.complexity] || 'neutral'}>{t.complexity}</Badge>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{t.description}</p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <Button size="sm" variant="ghost" onClick={() => setSelected(t)}>Prompt</Button>
                <Button size="sm" onClick={() => use(t)}>Use</Button>
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
