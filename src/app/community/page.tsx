'use client';

import React from 'react';
import { Card, Badge, Button } from '@/components/ui';
import { getRelativeTime } from '@/lib/utils';

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  authorTag: string | null;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  _count: { comments: number };
}

const CATEGORIES = [
  { id: 'all', label: 'All' }, { id: 'general', label: 'General' }, { id: 'salary', label: 'Salary' },
  { id: 'interview', label: 'Interview' }, { id: 'wlb', label: 'Work-Life Balance' },
  { id: 'career', label: 'Career' }, { id: 'rant', label: 'Rant' },
];

export default function CommunityPage() {
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [category, setCategory] = React.useState('all');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    fetch(`/api/community?${params}`)
      .then(r => r.json())
      .then(json => setPosts(json.data || []))
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-h1 text-heading">Community</h1>
          <p className="text-body text-muted mt-1">Anonymous discussions about careers, salaries, and workplace culture</p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              category === cat.id ? 'bg-primary text-white' : 'bg-surface-secondary text-body hover:bg-surface-tertiary'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-32 animate-shimmer rounded-xl" />)
        ) : posts.length === 0 ? (
          <Card className="text-center py-12"><p className="text-muted">No posts found in this category.</p></Card>
        ) : (
          posts.map(post => (
            <Card key={post.id} hover>
              <div className="flex gap-4">
                {/* Votes */}
                <div className="flex flex-col items-center gap-1 pt-1">
                  <button className="text-muted hover:text-primary transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 15l-6-6-6 6"/></svg>
                  </button>
                  <span className="text-body font-bold text-heading">{post.upvotes - post.downvotes}</span>
                  <button className="text-muted hover:text-danger transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="default" size="sm">{post.category}</Badge>
                    {post.authorTag && <span className="text-caption text-muted">{post.authorTag}</span>}
                    <span className="text-caption text-muted">· {getRelativeTime(new Date(post.createdAt))}</span>
                  </div>
                  <h3 className="text-body font-semibold text-heading mb-1.5">{post.title}</h3>
                  <p className="text-body-sm text-muted line-clamp-3">{post.content}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-caption text-muted flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                      {post._count.comments} comments
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
