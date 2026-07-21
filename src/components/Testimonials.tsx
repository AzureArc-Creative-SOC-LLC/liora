import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { testimonials } from "../data/site";

const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function Testimonials() {
  const root = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!trackRef.current) return;
    const track = trackRef.current;

    const ctx = gsap.context(() => {
      const half = track.scrollWidth / 2;
      const tween = gsap.to(track, {
        x: -half,
        duration: 40,
        ease: "none",
        repeat: -1,
        modifiers: {
          x: (x) => `${parseFloat(x) % -half}px`,
        },
      });

      const onEnter = () => gsap.to(tween, { timeScale: 0.2, duration: 0.4 });
      const onLeave = () => gsap.to(tween, { timeScale: 1, duration: 0.4 });
      track.addEventListener("mouseenter", onEnter);
      track.addEventListener("mouseleave", onLeave);

      gsap.utils.toArray<HTMLElement>(".testimonial").forEach((card) => {
        const avatar = card.querySelector(".testimonial__avatar");
        card.addEventListener("mouseenter", () => {
          gsap.to(avatar, { filter: "grayscale(0%)", duration: 0.4 });
        });
        card.addEventListener("mouseleave", () => {
          gsap.to(avatar, { filter: "grayscale(100%)", duration: 0.4 });
        });
      });

      return () => {
        track.removeEventListener("mouseenter", onEnter);
        track.removeEventListener("mouseleave", onLeave);
      };
    }, root);

    return () => ctx.revert();
  }, []);

  const items = [...testimonials, ...testimonials];

  return (
    <section id="reviews" className="testimonials" ref={root}>
      <div className="container testimonials__head">
        <div>
          <span className="eyebrow">Reviews</span>
          <h2 className="h2" style={{ marginTop: "1rem" }}>
            From researchers we support.
          </h2>
        </div>
        <p className="lead">
          Unedited words from {testimonials.length}+ labs and independent
          researchers we've supplied.
        </p>
      </div>

      <div className="marquee" ref={trackRef}>
        {items.map((t, i) => (
          <article
            className="testimonial"
            key={`${t.name}-${i}`}
            data-cursor
            data-cursor-text="Read"
          >
            <p className="testimonial__quote">"{t.quote}"</p>
            <div className="testimonial__author">
              {t.avatar ? (
                <img
                  className="testimonial__avatar"
                  src={t.avatar}
                  alt={`${t.name} — ${t.role} verified review of Liora Healthcare`}
                  loading="lazy"
                />
              ) : (
                <span className="testimonial__avatar" aria-hidden>
                  {initials(t.name)}
                </span>
              )}
              <div>
                <div className="testimonial__name">{t.name}</div>
                <div className="testimonial__role">{t.role}</div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
