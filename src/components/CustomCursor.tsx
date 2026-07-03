import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !label) return;

    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, opacity: 0 });

    const xDot = gsap.quickTo(dot, "x", { duration: 0.05, ease: "power3.out" });
    const yDot = gsap.quickTo(dot, "y", { duration: 0.05, ease: "power3.out" });
    const xRing = gsap.quickTo(ring, "x", { duration: 0.15, ease: "power3.out" });
    const yRing = gsap.quickTo(ring, "y", { duration: 0.15, ease: "power3.out" });

    let visible = false;

    const onMove = (event: MouseEvent) => {
      if (!visible) {
        gsap.to([dot, ring], { opacity: 1, duration: 0.3 });
        visible = true;
      }
      xDot(event.clientX);
      yDot(event.clientY);
      xRing(event.clientX);
      yRing(event.clientY);
    };

    const onOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const interactive = target.closest<HTMLElement>(
        "a, button, [data-cursor], input, textarea, label",
      );
      const text = interactive?.dataset.cursorText;

      if (interactive) {
        ring.classList.add("is-hover");
        if (text) {
          label.textContent = text;
          ring.classList.add("has-text");
        }
      } else {
        ring.classList.remove("is-hover", "has-text");
        label.textContent = "";
      }
    };

    const onLeave = () => {
      gsap.to([dot, ring], { opacity: 0, duration: 0.2 });
      visible = false;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    document.addEventListener("mouseleave", onLeave);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <>
      <div className="cursor-ring" ref={ringRef} aria-hidden>
        <span className="cursor-label" ref={labelRef} />
      </div>
      <div className="cursor-dot" ref={dotRef} aria-hidden />
    </>
  );
}
