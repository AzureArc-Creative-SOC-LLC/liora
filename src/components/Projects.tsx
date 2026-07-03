import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { projects } from "../data/site";
import { useCart } from "../hooks/useCart";

export function Projects() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const { addItem, open: openCart } = useCart();

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const mm = gsap.matchMedia();

    // Horizontal pinned scroll only on desktop. On smaller screens the cards
    // stack vertically (CSS) and matchMedia auto-reverts the transform/pin.
    mm.add("(min-width: 992px)", () => {
      const distance = () => track.scrollWidth - window.innerWidth + 64;

      const horizontal = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });

      gsap.utils.toArray<HTMLElement>(".project").forEach((card) => {
        gsap.from(card.querySelector(".project__art"), {
          scale: 1.05,
          ease: "none",
          scrollTrigger: {
            trigger: card,
            containerAnimation: horizontal,
            start: "left right",
            end: "right left",
            scrub: true,
          },
        });

        gsap.from(card.querySelector(".project__body"), {
          y: 32,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            containerAnimation: horizontal,
            start: "left 80%",
          },
        });
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <section id="work" className="projects-pin" ref={sectionRef}>
      <div className="container projects__head">
        <div>
          <span className="eyebrow">Catalogue</span>
          <h2 className="h2" style={{ marginTop: "1rem" }}>
            Available products.
          </h2>
        </div>
        <p className="lead">
          Research-grade peptides and supplement formulations. Documentation
          and batch data available on request.
        </p>
      </div>

      <div className="projects__viewport">
        <div className="projects__track" ref={trackRef}>
          {projects.map((p, i) => (
            <article className="project" key={p.id}>
              <div className="project__media">
                <div className="project__art">
                  {"image" in p && p.image ? (
                    <img
                      className="project__photo"
                      src={p.image}
                      alt={p.title}
                      loading="lazy"
                      style={
                        "imageShift" in p && p.imageShift
                          ? { transform: `translateX(${p.imageShift})` }
                          : undefined
                      }
                    />
                  ) : (
                    p.title
                  )}
                </div>
                <div className="project__index">
                  {String(i + 1).padStart(2, "0")} /{" "}
                  {String(projects.length).padStart(2, "0")}
                </div>
              </div>
              <div className="project__body">
                <div className="project__meta">
                  <span>{p.sector}</span>
                  <span>{p.year}</span>
                </div>
                <h3 className="project__title">{p.title}</h3>
                <p className="project__summary">{p.summary}</p>
                <div className="project__actions">
                  <a
                    className="project__link"
                    href={`#/product/${p.id}`}
                    data-cursor
                    data-cursor-text="View"
                  >
                    Read more
                  </a>
                  <button
                    type="button"
                    className="project__quick"
                    onClick={(e) => {
                      e.preventDefault();
                      addItem(p.id, 1);
                      openCart();
                    }}
                    aria-label={`Add ${p.title} to cart`}
                    data-cursor
                  >
                    <span aria-hidden>+</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
