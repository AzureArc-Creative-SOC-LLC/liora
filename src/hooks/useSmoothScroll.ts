import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

let lenisInstance: Lenis | null = null;

export function getLenis(): Lenis | null {
  return lenisInstance;
}

export function smoothScrollTo(target: string | HTMLElement) {
  const lenis = lenisInstance;
  if (!lenis) {
    if (typeof target === "string") {
      const el = document.querySelector<HTMLElement>(target);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    return;
  }
  const navEl = document.querySelector<HTMLElement>(".nav");
  const navHeight = navEl?.offsetHeight ?? 0;
  lenis.scrollTo(target, {
    offset: -navHeight - 8,
    duration: 1.3,
  });
}

export function useSmoothScroll(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisInstance = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const onAnchorClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey)
        return;

      const target = event.target as HTMLElement | null;
      if (!target) return;

      const link = target.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href || href === "#" || href.length < 2) return;

      // Hash routes (e.g. "#/product/p1") aren't valid CSS selectors and
      // aren't in-page anchors — let the browser handle them.
      if (href.startsWith("#/")) return;

      let dest: HTMLElement | null;
      try {
        dest = document.querySelector<HTMLElement>(href);
      } catch {
        return;
      }
      if (!dest) return;

      event.preventDefault();
      smoothScrollTo(dest);
    };

    document.addEventListener("click", onAnchorClick);

    return () => {
      document.removeEventListener("click", onAnchorClick);
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisInstance = null;
    };
  }, [enabled]);
}
