import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import "gsap/ScrollTrigger";

export function useSectionReveal<T extends HTMLElement>(
  selector: string = "[data-reveal]",
) {
  const containerRef = useRef<T | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const targets = el.querySelectorAll<HTMLElement>(selector);
      targets.forEach((target) => {
        gsap.from(target, {
          y: 48,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: target,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        });
      });
    }, el);

    return () => ctx.revert();
  }, [selector]);

  return containerRef;
}
