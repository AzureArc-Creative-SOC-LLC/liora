import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { whyUs } from "../data/site";
import { SplitText } from "./SplitText";

export function WhyUs() {
  const root = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!root.current) return;
    const ctx = gsap.context(() => {
      gsap.set(".why__heading .char", { yPercent: 110 });
      gsap.to(".why__heading .char", {
        yPercent: 0,
        duration: 1,
        ease: "power4.out",
        stagger: 0.02,
        scrollTrigger: {
          trigger: ".why__heading",
          start: "top 80%",
        },
      });

      gsap.from(".why__card", {
        y: 64,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: ".why__rail",
          start: "top 78%",
        },
      });

      gsap.from("[data-why-reveal]", {
        y: 24,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: root.current,
          start: "top 80%",
        },
      });
    }, root);

    return () => {
      ctx.revert();
      ScrollTrigger.refresh();
    };
  }, []);

  return (
    <section id="why-us" className="container section why" ref={root}>
      <div className="why__head">
        <div className="why__head-meta">
          <span className="eyebrow" data-why-reveal>
            Why us
          </span>
          <span className="mono" data-why-reveal>
            {String(activeIndex + 1).padStart(2, "0")} /{" "}
            {String(whyUs.length).padStart(2, "0")}
          </span>
        </div>
        <SplitText
          text="Why labs choose us."
          as="h2"
          className="why__heading"
        />
        <p className="why__lead" data-why-reveal>
          Hover a tile to expand it. Four commitments we hold to on every
          order, regardless of size or destination.
        </p>
      </div>

      <div
        className="why__rail"
        onMouseLeave={() => setActiveIndex(0)}
      >
        {whyUs.map((item, i) => {
          const isActive = i === activeIndex;
          return (
            <article
              key={item.number}
              className={clsx("why__card", isActive && "is-active")}
              onMouseEnter={() => setActiveIndex(i)}
              onFocus={() => setActiveIndex(i)}
              onClick={() => setActiveIndex(i)}
              tabIndex={0}
              data-cursor
              data-cursor-text={isActive ? "Active" : "Open"}
            >
              <img
                className="why__card-media"
                src={item.image}
                alt=""
                aria-hidden
                loading="lazy"
              />

              <header className="why__card-shell">
                <span className="why__card-num">{item.number}</span>
                <span className="why__card-title-v">{item.title}</span>
                <span className="why__card-corner" aria-hidden>
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
              </header>

              <div className="why__card-expanded">
                <span className="why__card-num why__card-num--big">
                  {item.number}
                </span>
                <h3 className="why__card-title-h">{item.title}</h3>
                <p className="why__card-desc">{item.description}</p>
                <span className="why__card-line" aria-hidden />
                <span className="why__card-meta">
                  <span className="mono">Promise</span>
                </span>
              </div>
            </article>
          );
        })}
      </div>

      <div className="why__progress" data-why-reveal>
        {whyUs.map((_, i) => (
          <button
            key={i}
            type="button"
            className={clsx(
              "why__progress-dot",
              i === activeIndex && "is-active",
            )}
            aria-label={`Show reason ${i + 1}`}
            onClick={() => setActiveIndex(i)}
            data-cursor
          />
        ))}
      </div>
    </section>
  );
}
