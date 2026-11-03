import { useCallback, useEffect, useRef, useState } from 'react';

// Runs an async loader and tracks loading / error / data. Ignores stale responses.
export const useAsync = (loader, deps = []) => {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const seq = useRef(0);

  const run = useCallback(() => {
    const id = ++seq.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    return loader()
      .then((data) => id === seq.current && setState({ loading: false, error: null, data }))
      .catch((error) => id === seq.current && setState((s) => ({ loading: false, error, data: s.data })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { ...state, reload: run, setData: (fn) => setState((s) => ({ ...s, data: typeof fn === 'function' ? fn(s.data) : fn })) };
};
