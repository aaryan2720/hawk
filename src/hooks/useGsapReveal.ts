import { useEffect, RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Reveals every element marked with `data-reveal` inside the given scope as it
 * scrolls into view. Respects the user's reduced-motion preference.
 *
 * Usage:
 *   const scope = useRef<HTMLDivElement>(null);
 *   useGsapReveal(scope);
 *   <div ref={scope}> <section data-reveal> ... </section> </div>
 */
export function useGsapReveal(scope: RefObject<HTMLElement>) {
  useEffect(() => {
    if (!scope.current) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      scope.current
        .querySelectorAll<HTMLElement>('[data-reveal]')
        .forEach((el) => (el.style.opacity = '1'));
      return;
    }

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 36 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          }
        );
      });

      gsap.utils.toArray<HTMLElement>('[data-reveal-stagger] > *').forEach((el, i) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            delay: (i % 3) * 0.08,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 92%', once: true },
          }
        );
      });
    }, scope);

    return () => ctx.revert();
  }, [scope]);
}

export default useGsapReveal;
