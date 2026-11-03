import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Copy, Download, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { projectsApi, errorMessage } from '../../lib/api';
import { ConfirmDialog, Dialog, Button, Field, Input } from '../../components/ui';

// Rename / duplicate / download / delete for a project, with the dialogs they need.
export const useProjectActions = ({ onChanged, onRemoved } = {}) => {
  const navigate = useNavigate();
  const [renaming, setRenaming] = useState(null);
  const [name, setName] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const menuItems = (p) => [
    { label: 'Open', icon: ExternalLink, onSelect: () => navigate(`/projects/${p.id}`) },
    { label: 'Rename', icon: Pencil, onSelect: () => { setRenaming(p); setName(p.title); } },
    {
      label: 'Duplicate',
      icon: Copy,
      onSelect: async () => {
        try {
          const { extension } = await projectsApi.duplicate(p.id);
          toast.success('Project duplicated');
          onChanged?.(extension);
        } catch (e) {
          toast.error(errorMessage(e, 'Could not duplicate'));
        }
      },
    },
    {
      label: 'Download ZIP',
      icon: Download,
      onSelect: () => projectsApi.download(p.id, p.title).catch((e) => toast.error(errorMessage(e, 'Download failed'))),
    },
    { divider: true },
    { label: 'Delete', icon: Trash2, danger: true, onSelect: () => setDeleting(p) },
  ];

  const saveName = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const { extension } = await projectsApi.update(renaming.id, { title: name.trim() });
      onChanged?.(extension);
      setRenaming(null);
    } catch (err) {
      toast.error(errorMessage(err, 'Rename failed'));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await projectsApi.remove(deleting.id);
      toast.success('Project deleted');
      onRemoved?.(deleting.id);
      setDeleting(null);
    } catch (err) {
      toast.error(errorMessage(err, 'Delete failed'));
    } finally {
      setBusy(false);
    }
  };

  const dialogs = (
    <>
      <Dialog
        open={!!renaming}
        onClose={() => setRenaming(null)}
        title="Rename project"
        size="sm"
      >
        <form onSubmit={saveName} className="space-y-4">
          <Field label="Name">
            <Input value={name} maxLength={200} onChange={(e) => setName(e.target.value)} data-autofocus />
          </Field>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setRenaming(null)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={busy} disabled={!name.trim()}>
              Save
            </Button>
          </div>
        </form>
      </Dialog>
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={busy}
        danger
        title={`Delete “${deleting?.title}”?`}
        description="The project, its files and its version history will be permanently deleted."
        confirmLabel="Delete project"
      />
    </>
  );

  return { menuItems, dialogs };
};
