import { useCallback, useEffect, useRef, useState } from 'react';
import { projectsApi, errorMessage } from '../../lib/api';

const AUTOSAVE_MS = 1500;

/**
 * Project state for the workspace: the server copy, the working copy of files,
 * debounced autosave, and validation results.
 * saveState: 'saved' | 'dirty' | 'saving' | 'error'
 */
export const useProject = (id) => {
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [validation, setValidation] = useState({ errors: [], warnings: [] });
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState('saved');
  const [saveError, setSaveError] = useState('');

  const filesRef = useRef(files);
  const timer = useRef(null);
  const inflight = useRef(null);
  const dirty = useRef(false);
  filesRef.current = files;

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await projectsApi.get(id);
      setProject(res.extension);
      setFiles(res.extension.files || []);
      setValidation(res.validation || { errors: [], warnings: [] });
      dirty.current = false;
      setSaveState('saved');
    } catch (e) {
      setLoadError(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(async () => {
    clearTimeout(timer.current);
    if (!dirty.current) return inflight.current;
    // Serialize saves so an older request can't overwrite a newer one.
    if (inflight.current) await inflight.current.catch(() => {});
    if (!dirty.current) return undefined;
    dirty.current = false;
    setSaveState('saving');
    const snapshot = filesRef.current;
    const p = projectsApi
      .saveFiles(id, snapshot)
      .then((res) => {
        setProject(res.extension);
        setValidation(res.validation);
        // Server may add generated icons; merge them in without clobbering newer edits.
        setFiles((current) => {
          const names = new Set(current.map((f) => f.filename));
          const added = res.extension.files.filter((f) => !names.has(f.filename) && f.encoding === 'base64');
          return added.length ? [...current, ...added] : current;
        });
        setSaveError('');
        setSaveState(dirty.current ? 'dirty' : 'saved');
      })
      .catch((e) => {
        dirty.current = true;
        setSaveError(errorMessage(e, 'Save failed'));
        setSaveState('error');
        throw e;
      })
      .finally(() => {
        inflight.current = null;
      });
    inflight.current = p;
    return p;
  }, [id]);

  const markDirty = useCallback(() => {
    dirty.current = true;
    setSaveState('dirty');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => save().catch(() => {}), AUTOSAVE_MS);
  }, [save]);

  const updateFile = useCallback(
    (filename, content) => {
      setFiles((fs) => fs.map((f) => (f.filename === filename ? { ...f, content } : f)));
      markDirty();
    },
    [markDirty]
  );

  const createFile = useCallback(
    (filename, content = '') => {
      setFiles((fs) => [...fs, { filename, content }]);
      markDirty();
    },
    [markDirty]
  );

  const renameFile = useCallback(
    (from, to) => {
      setFiles((fs) => fs.map((f) => (f.filename === from ? { ...f, filename: to } : f)));
      markDirty();
    },
    [markDirty]
  );

  const deleteFile = useCallback(
    (filename) => {
      setFiles((fs) => fs.filter((f) => f.filename !== filename));
      markDirty();
    },
    [markDirty]
  );

  // Replace everything with a server result (AI apply, version restore).
  const replaceFromServer = useCallback((extension, nextValidation) => {
    clearTimeout(timer.current);
    dirty.current = false;
    setProject(extension);
    setFiles(extension.files || []);
    if (nextValidation) setValidation(nextValidation);
    setSaveState('saved');
  }, []);

  const refreshValidation = useCallback(async () => {
    const res = await projectsApi.validate(id);
    setValidation(res.validation);
    return res.validation;
  }, [id]);

  // Warn before closing the tab with unsaved changes; flush on unmount.
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (dirty.current || inflight.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      if (dirty.current) save().catch(() => {});
    };
  }, [save]);

  return {
    project, setProject, files, validation, loading, loadError, reload: load,
    saveState, saveError, save, updateFile, createFile, renameFile, deleteFile,
    replaceFromServer, refreshValidation, setValidation,
  };
};
