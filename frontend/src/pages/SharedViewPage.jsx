import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowBigUp, Copy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { galleryApi, errorMessage } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { Button, ErrorState, Spinner, cx } from '../components/ui';

const SharedViewPage = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { loading, error, data, reload, setData } = useAsync(() => galleryApi.shared(id), [id]);
  const [file, setFile] = useState(0);
  const [busy, setBusy] = useState(false);

  if (loading && !data) return <div className="flex justify-center py-24"><Spinner /></div>;
  if (error) {
    const missing = error.response?.status === 404 || error.response?.status === 400;
    return <ErrorState title={missing ? 'Extension not found' : 'Could not load'} message={missing ? 'It may be private or deleted.' : errorMessage(error)} onRetry={missing ? undefined : reload} />;
  }
  const ext = data.extension;
  const textFiles = ext.files.filter((f) => f.encoding !== 'base64');
  const current = textFiles[file] || textFiles[0];

  const act = async (fn) => {
    if (!isAuthenticated) return navigate('/login', { state: { from: `/shared/${id}` } });
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      toast(e.response?.status === 409 ? 'You already upvoted this' : errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight">{ext.title}</h1>
          <p className="mt-2 text-sm text-muted">{ext.storeAssets?.description || ext.prompt}</p>
        </div>
        <div className="flex gap-2">
          <Button disabled={busy} onClick={() => act(async () => { const { upvotes } = await galleryApi.upvote(id); setData((d) => ({ ...d, extension: { ...d.extension, upvotes } })); })}>
            <ArrowBigUp className="h-4 w-4" aria-hidden="true" /> {ext.upvotes}
          </Button>
          <Button variant="primary" disabled={busy} onClick={() => act(async () => { const { extensionId } = await galleryApi.clone(id); navigate(`/projects/${extensionId}`); })}>
            <Copy className="h-4 w-4" aria-hidden="true" /> Clone to my projects
          </Button>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-lg border border-border md:grid md:grid-cols-[200px_1fr]">
        <nav aria-label="Files" className="border-b border-border bg-surface p-1.5 md:border-b-0 md:border-r">
          <ul className="flex gap-1 overflow-x-auto md:block md:space-y-0.5">
            {textFiles.map((f, i) => (
              <li key={f.filename}>
                <button
                  type="button"
                  onClick={() => setFile(i)}
                  aria-current={i === file ? 'true' : undefined}
                  className={cx('w-full whitespace-nowrap rounded px-2 py-1 text-left font-mono text-[12px]', i === file ? 'bg-primary-soft text-fg' : 'text-muted hover:bg-surface-2')}
                >
                  {f.filename}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <pre className="max-h-[60vh] overflow-auto p-4 font-mono text-[12px] leading-5"><code>{current?.content}</code></pre>
      </div>
      <p className="mt-3 text-[12px] text-muted">Shared by a community member. Review the code and permissions before installing.</p>
    </div>
  );
};

export default SharedViewPage;
