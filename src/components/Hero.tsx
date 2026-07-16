import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { site, heroCopy } from "../data/site";
import { SplitText } from "./SplitText";
import { useMagnetic } from "../hooks/useMagnetic";
import heroImg from "../assets/hero-seo-update.webp";

export function Hero() {
  const root = useRef<HTMLElement | null>(null);
  const arrowRef = useMagnetic<HTMLAnchorElement>(0.4);

  useEffect(() => {
    if (!root.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero .char",
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 1.2,
          ease: "power4.out",
          stagger: { each: 0.025, from: "start" },
          delay: 0.2,
        },
      );

      gsap.from(".hero [data-fade]", {
        y: 24,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        delay: 1,
        stagger: 0.1,
      });

      gsap.fromTo(
        ".hero__image-inner",
        { clipPath: "inset(100% 0% 0% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.4,
          ease: "power4.out",
          delay: 0.4,
        },
      );

      gsap.to(".hero__meta", {
        yPercent: -40,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.to(".hero__display", {
        yPercent: 18,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.to(".hero__image", {
        yPercent: -15,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.to(".hero__image-inner img", {
        scale: 1.1,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.to(".hero__bottom", {
        yPercent: -25,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
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

  return (
    <section id="home" className="container hero" ref={root}>
      <div className="hero__meta">
        <div data-fade className="mono">
          {site.role}
        </div>
        <div data-fade className="mono">
          {site.name} · Est. {new Date().getFullYear()}
        </div>
      </div>

      <div className="hero__layout">
        <div className="hero__text">
          <h1 className="hero__display">
            <SplitText text={heroCopy.headlineTop} as="span" />
            <SplitText text={heroCopy.headlineBottom} as="span" />
          </h1>
          <p className="hero__lead" data-fade>
            {heroCopy.intro}
          </p>

          <div className="hero__bottom">
            <a
              className="hero__scroll"
              href="#about"
              data-fade
              data-cursor
              data-cursor-text="Scroll"
              ref={arrowRef}
            >
              <span>Scroll</span>
              <span className="hero__scroll-arrow" aria-hidden />
            </a>

            <div className="hero__tags" data-fade>
              <span className="hero__tag">{site.role}</span>
              <span className="hero__tag">{heroCopy.available}</span>
            </div>
          </div>
        </div>

        <figure className="hero__image" data-cursor data-cursor-text="Lab">
          <span className="hero__layer hero__layer--cream" aria-hidden />
          <span className="hero__layer hero__layer--orange" aria-hidden />
          <span className="hero__layer hero__layer--glass" aria-hidden />
          <div className="hero__image-inner">
            <img
              src={heroImg}
              alt="Liora Healthcare research-grade peptides — verified purity, sourced and sealed in Dubai"
            />
          </div>
          <span className="hero__image-tag hero__image-tag--tl">
            Verified supply
          </span>
          <span className="hero__image-tag hero__image-tag--br">
            Sealed & tested
          </span>
        </figure>
      </div>
    </section>
  );
}
