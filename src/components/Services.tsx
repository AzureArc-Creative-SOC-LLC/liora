import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { services } from "../data/site";

export function Services() {
  const root = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!root.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".service", {
        y: 64,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: root.current,
          start: "top 75%",
        },
      });
    }, root);
    return () => {
      ctx.revert();
      ScrollTrigger.refresh();
    };
  }, []);

  return (
    <section id="services" className="container section" ref={root}>
      <div className="services__head">
        <div>
          <span className="eyebrow">Standards</span>
          <h2 className="h2" style={{ marginTop: "1rem" }}>
            Quality is the work.
          </h2>
        </div>
        <p className="lead">
          Four standards we hold ourselves to on every order — the same whether
          you're a postdoc reordering a single research kit or a lab
          provisioning a year of research.
        </p>
      </div>

      <div className="services__grid">
        {services.map((service) => (
          <article
            className="service"
            key={service.number}
            data-cursor
            data-cursor-text="More"
          >
            <span className="service__corner tl" aria-hidden />
            <span className="service__corner tr" aria-hidden />
            <span className="service__corner bl" aria-hidden />
            <span className="service__corner br" aria-hidden />
            <span className="service__num">{service.number}</span>
            <h3 className="service__title">{service.title}</h3>
            <p className="service__desc">{service.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
