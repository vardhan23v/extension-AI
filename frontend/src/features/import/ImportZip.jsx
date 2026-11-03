import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Upload } from 'lucide-react';
import { projectsApi, errorMessage } from '../../lib/api';
import { Button, cx } from '../../components/ui';

const MAX_BYTES = 5 * 1024 * 1024;

// Upload an existing extension ZIP: button + optional drop zone.
// On success opens the project (Problems tab when validation found errors).
export const useImportZip = () => {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const importFile = async (file) => {
    if (!file) return;
    if (!/\.zip$/i.test(file.name)) return toast.error('Choose a .zip file of your extension');
    if (file.size > MAX_BYTES) return toast.error('The ZIP is larger than 5 MB');
    setBusy(true);
    try {
      const { extension, validation, skipped } = await projectsApi.importZip(file);
      const notes = [validation.errors.length && `${validation.errors.length} problem(s) to fix`, skipped?.length && `${skipped.length} unsupported file(s) skipped`].filter(Boolean);
      toast.success(`Imported “${extension.title}”${notes.length ? ` — ${notes.join(', ')}` : ''}`);
      navigate(`/projects/${extension.id}${validation.errors.length ? '?panel=problems' : ''}`);
    } catch (e) {
      toast.error(errorMessage(e, 'Import failed'));
    } finally {
      setBusy(false);
    }
  };
  return { busy, importFile };
};

export const ImportZipButton = ({ size = 'md', variant = 'secondary' }) => {
  const input = useRef(null);
  const { busy, importFile } = useImportZip();
  return (
    <>
      <input
        ref={input}
        type="file"
        accept=".zip,application/zip"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          importFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <Button size={size} variant={variant} loading={busy} onClick={() => input.current?.click()}>
        {!busy && <Upload className="h-4 w-4" aria-hidden="true" />} Import ZIP
      </Button>
    </>
  );
};

// Wraps content so a ZIP can be dropped anywhere on it.
export const ImportDropZone = ({ children }) => {
  const [over, setOver] = useState(false);
  const { importFile } = useImportZip();
  return (
    <div
      onDragOver={(e) => {
        if ([...e.dataTransfer.items].some((i) => i.kind === 'file')) {
          e.preventDefault();
          setOver(true);
        }
      }}
      onDragLeave={(e) => e.currentTarget.contains(e.relatedTarget) || setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        importFile(e.dataTransfer.files?.[0]);
      }}
      className={cx('relative', over && 'after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:border-2 after:border-dashed after:border-primary after:bg-primary/5')}
    >
      {children}
      {over && (
        <p className="pointer-events-none absolute inset-x-0 top-1/3 z-10 text-center text-sm font-medium text-primary">Drop the ZIP to import it</p>
      )}
    </div>
  );
};
