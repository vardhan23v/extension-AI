import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowBigUp, Copy, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { galleryApi, errorMessage } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { timeAgo } from '../lib/format';
import { Button, EmptyState, ErrorState, PageHeader, Skeleton } from '../components/ui';

const GalleryPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { loading, error, data, reload, setData } = useAsync(() => galleryApi.list(), []);
  const [busy, setBusy] = useState(null);

  const requireAuth = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/gallery' } });
      return false;
    }
    return true;
  };

  const upvote = async (ext) => {
    if (!requireAuth()) return;
    setBusy(`up-${ext.id}`);
    try {
      const { upvotes } = await galleryApi.upvote(ext.id);
      setData((d) => ({ ...d, extensions: d.extensions.map((x) => (x.id === ext.id ? { ...x, upvotes } : x)) }));
    } catch (e) {
      toast(e.response?.status === 409 ? 'You already upvoted this' : errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const clone = async (ext) => {
    if (!requireAuth()) return;
    setBusy(`clone-${ext.id}`);
    try {
      const { extensionId } = await galleryApi.clone(ext.id);
      toast.success('Cloned to your projects');
      navigate(`/projects/${extensionId}`);
    } catch (e) {
      toast.error(errorMessage(e, 'Clone failed'));
    } finally {
      setBusy(null);
    }
  };

  const items = data?.extensions || [];
  return (
    <div className={isAuthenticated ? '' : 'mx-auto max-w-6xl px-4 py-10'}>
      <PageHeader title="Community" description="Extensions other people chose to share. Review the code before installing anything." />
      {error && !data ? (
        <ErrorState message={errorMessage(error)} onRetry={reload} />
      ) : loading && !data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-36" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={Users} title="Nothing shared yet" description="Share one of your projects from its workspace menu and it will appear here." />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((ext) => (
            <li key={ext.id} className="flex flex-col rounded-lg border border-border p-4">
              <Link to={`/shared/${ext.id}`} className="text-sm font-semibold hover:underline">{ext.title}</Link>
              <p className="mt-1 line-clamp-3 flex-1 text-[13px] text-muted">{ext.storeAssets?.description || ext.prompt}</p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="text-[12px] text-subtle">{timeAgo(ext.createdAt)} · {ext.cloneCount} clones</span>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="ghost" onClick={() => upvote(ext)} loading={busy === `up-${ext.id}`} aria-label={`Upvote ${ext.title} (${ext.upvotes} votes)`}>
                    <ArrowBigUp className="h-4 w-4" aria-hidden="true" /> {ext.upvotes}
                  </Button>
                  <Button size="sm" onClick={() => clone(ext)} loading={busy === `clone-${ext.id}`}>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Clone
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GalleryPage;
