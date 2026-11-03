import { useEffect, useRef } from 'react';

// Reveals [data-reveal] children once as they scroll into view.
// Content is only hidden after this runs, so it stays visible without JS.
export const useReveal = () => {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || !('IntersectionObserver' in window)) return undefined;
    root.classList.add('js-reveal');
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        }),
      { rootMargin: '0px 0px -10% 0px' }
    );
    root.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return ref;
};
