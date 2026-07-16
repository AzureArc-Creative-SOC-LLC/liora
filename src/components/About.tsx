import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { aboutCopy, site } from "../data/site";
import { SplitText } from "./SplitText";

const aboutImageSrc = site.aboutImage;

const initials = (
  site.name.includes(" ")
    ? site.name
        .split(" ")
        .map((n) => n[0])
        .join("")
    : site.name
)
  .slice(0, 2)
  .toUpperCase();

export function About() {
  const root = useRef<HTMLElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (!root.current) return;
    const ctx = gsap.context(() => {
      // The start state must live inside the tween: a standalone gsap.set() is
      // re-applied by ScrollTrigger.refresh() (which images fire on load) and
      // strands the chars offset behind the .split mask.
      gsap.fromTo(
        ".about__heading .char",
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 1,
          ease: "power4.out",
          stagger: 0.02,
          scrollTrigger: {
            trigger: ".about__heading",
            start: "top 80%",
          },
        },
      );

      gsap.utils
        .toArray<HTMLElement>(".about__stat-value")
        .forEach((node) => {
          const target = Number(node.dataset.target ?? 0);
          const counter = { value: 0 };
          gsap.to(counter, {
            value: target,
            duration: 1.6,
            ease: "power2.out",
            scrollTrigger: {
              trigger: node,
              start: "top 85%",
              toggleActions: "play none none reset",
            },
            onUpdate: () => {
              const numEl = node.querySelector(".about__stat-number");
              if (numEl) numEl.textContent = String(Math.round(counter.value));
            },
          });
        });

      gsap.from("[data-about-reveal]", {
        y: 32,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: root.current,
          start: "top 75%",
        },
      });

      gsap.fromTo(
        ".about__media-inner",
        { clipPath: "inset(0% 0% 100% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.4,
          ease: "power4.out",
          scrollTrigger: {
            trigger: ".about__media",
            start: "top 85%",
          },
        },
      );

      gsap.to(".about__media-inner img, .about__photo-fallback", {
        yPercent: 12,
        ease: "none",
        scrollTrigger: {
          trigger: ".about__media",
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.to(".about__body", {
        yPercent: -6,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    }, root);

    return () => {
      ctx.revert();
      ScrollTrigger.refresh();
    };
  }, []);

  const year = new Date().getFullYear();

  return (
    <section id="about" className="container section about" ref={root}>
      <div className="about__grid">
        <figure className="about__media" data-cursor data-cursor-text="Lab">
          <div className="about__media-inner">
            {!imageFailed && (
              <img
                className="about__photo-img"
                src={aboutImageSrc}
                alt={`${site.name} — research-grade peptide and supplement laboratory facility in ${site.location}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageFailed(true)}
                style={{ opacity: imageLoaded ? 1 : 0 }}
              />
            )}
            <div className="about__photo-fallback" aria-hidden>
              <span className="about__photo-initials">{initials}</span>
              <div className="about__photo-grain" />
            </div>
            <span className="about__photo-tag about__photo-tag--tl">
              © {year} · {site.name}
            </span>
            <span className="about__photo-tag about__photo-tag--bl">
              {site.location}
            </span>
            <span className="about__photo-tag about__photo-tag--br">
              Facility · No. 01
            </span>
          </div>
        </figure>

        <div className="about__content">
          <span className="eyebrow" data-about-reveal>
            About
          </span>
          <SplitText
            text={aboutCopy.heading}
            as="h2"
            className="about__heading"
          />
          <p className="about__body" data-about-reveal>
            {aboutCopy.paragraph}
          </p>

          <ul className="about__signals" data-about-reveal>
            {aboutCopy.signals.map((s) => (
              <li key={s.label}>
                <span className="mono">{s.label}</span>
                <span>{s.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="about__stats">
        {aboutCopy.stats.map((stat) => (
          <div className="about__stat" key={stat.label} data-about-reveal>
            <div className="about__stat-value" data-target={stat.value}>
              <span className="about__stat-number">0</span>
              <span className="about__stat-suffix">{stat.suffix}</span>
            </div>
            <div className="about__stat-label">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
