import { useCallback, useEffect, useRef, useState } from 'react';
import { createInitialContactData, createInitialEventData } from '../types';
import { loadWorkspaceDraft, saveWorkspaceDraft, WorkspaceData } from '../utils/storageHelper';
import { clearGeneratorStorage, LIBRARY_STORAGE_KEY } from '../utils/libraryHelper';
import { WORKSPACE_STORAGE_KEY } from '../utils/storageHelper';

const freshWorkspace = (): WorkspaceData => ({ mode: 'contact', contact: createInitialContactData(), event: createInitialEventData() });

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<WorkspaceData>(() => loadWorkspaceDraft() ?? freshWorkspace());
  const [restored] = useState(() => Boolean(loadWorkspaceDraft()));
  const [status, setStatus] = useState<'empty' | 'saving' | 'saved' | 'unavailable'>(restored ? 'saved' : 'empty');
  const [savedAt, setSavedAt] = useState<string | null>(() => loadWorkspaceDraft()?.savedAt ?? null);
  const [remoteClear, setRemoteClear] = useState(0);
  const shouldPersist = useRef(false);
  const latest = useRef(workspace);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelTimer = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  const persist = useCallback((showStatus = true) => {
    if (!shouldPersist.current) return;
    const timestamp = saveWorkspaceDraft(latest.current);
    if (showStatus) { setSavedAt(timestamp); setStatus(timestamp ? 'saved' : 'unavailable'); }
  }, []);

  const update = useCallback((updater: (previous: WorkspaceData) => WorkspaceData) => {
    // Keep the close/tab-hide handler in sync even before the next render.
    const next = updater(latest.current);
    latest.current = next;
    shouldPersist.current = true;
    setWorkspace(next);
    setStatus('saving');
    cancelTimer();
    timer.current = setTimeout(() => persist(), 350);
  }, [cancelTimer, persist]);

  const forget = useCallback(() => {
    shouldPersist.current = false;
    cancelTimer();
    const removed = clearGeneratorStorage();
    const next = freshWorkspace();
    latest.current = next;
    setWorkspace(next);
    setSavedAt(null);
    setStatus(removed ? 'empty' : 'unavailable');
    return removed;
  }, [cancelTimer]);

  useEffect(() => {
    const flush = () => { cancelTimer(); persist(false); };
    const visibility = () => { if (document.visibilityState === 'hidden') flush(); };
    const storage = (event: StorageEvent) => {
      if ((event.key === WORKSPACE_STORAGE_KEY || event.key === null) && event.newValue === null) {
        // A forget action in another tab must not be undone by this tab's pending autosave.
        shouldPersist.current = false;
        cancelTimer();
        const next = freshWorkspace();
        latest.current = next;
        setWorkspace(next);
        setSavedAt(null);
        setStatus('empty');
        setRemoteClear((value) => value + 1);
      } else if (event.key === LIBRARY_STORAGE_KEY) {
        setRemoteClear((value) => value + 1);
      }
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('storage', storage);
    return () => {
      cancelTimer();
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('storage', storage);
    };
  }, [cancelTimer, persist]);

  return { workspace, update, forget, status, savedAt, restored, remoteClear };
}
