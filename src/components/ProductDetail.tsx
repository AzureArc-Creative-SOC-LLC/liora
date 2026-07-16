import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { projects } from "../data/site";
import { useRouter } from "../hooks/useRouter";
import { useCart } from "../hooks/useCart";
import { productsKlymeStatusByName } from "../lib/api";

type Props = { id: string };

const formatUsd = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

export function ProductDetail({ id }: Props) {
  const product = projects.find((p) => p.id === id);
  const { navigate } = useRouter();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [klymeEligible, setKlymeEligible] = useState<boolean | null>(null);
  const root = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setActiveImageIdx(0);
  }, [id]);

  useEffect(() => {
    if (!product) return;
    let cancelled = false;
    const key = product.title.toLowerCase().replace(/\s+/g, " ").trim();
    setKlymeEligible(null);
    productsKlymeStatusByName([product.title])
      .then((res) => {
        if (cancelled) return;
        const settings = res.klyme_settings ?? {};
        setKlymeEligible(!!settings[key]);
      })
      .catch(() => {
        if (!cancelled) setKlymeEligible(false);
      });
    return () => {
      cancelled = true;
    };
  }, [product]);

  useEffect(() => {
    if (!root.current || !product) return;
    const ctx = gsap.context(() => {
      gsap.from(".pdp__media", {
        opacity: 0,
        y: 24,
        duration: 0.9,
        ease: "power3.out",
      });
      gsap.from(".pdp__details > *", {
        opacity: 0,
        y: 20,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.07,
        delay: 0.1,
      });
      gsap.from(".related__card", {
        opacity: 0,
        y: 30,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.08,
        delay: 0.4,
      });
    }, root);
    return () => ctx.revert();
  }, [product]);

  if (!product) {
    return (
      <section className="container pdp pdp--missing">
        <h1>Product not found</h1>
        <button
          type="button"
          className="pdp__back"
          onClick={() => navigate({ name: "home" })}
        >
          Back to catalogue
        </button>
      </section>
    );
  }

  const gallerySources: string[] =
    "subImages" in product && Array.isArray(product.subImages) && product.subImages.length > 0
      ? product.subImages
      : [product.image];
  const activeImage = gallerySources[activeImageIdx] ?? gallerySources[0];

  const related = projects.filter((p) => p.id !== product.id).slice(0, 3);

  const handleAdd = () => {
    addItem(product.id, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };

  return (
    <div className="pdp" ref={root}>
      <div className="container">
        <nav className="pdp__crumbs" aria-label="Breadcrumb">
          <button
            type="button"
            className="pdp__back"
            onClick={() => navigate({ name: "home" })}
            data-cursor
          >
            <span>Back to catalogue</span>
          </button>
          <span className="pdp__crumb-trail mono">
            Catalogue · {product.sector}
          </span>
        </nav>

        <div className="pdp__grid">
          <div className="pdp__gallery">
            <figure className="pdp__media">
              <div className="pdp__media-inner">
                <img
                  key={activeImage}
                  src={activeImage}
                  alt={product.title}
                />
              </div>
              <span className="pdp__media-tag pdp__media-tag--tl">
                Verified supply
              </span>
              <span className="pdp__media-tag pdp__media-tag--br">
                Sealed & tested
              </span>
            </figure>
            {gallerySources.length > 1 && (
              <div className="pdp__thumbs" role="tablist" aria-label="Product images">
                {gallerySources.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    role="tab"
                    aria-selected={activeImageIdx === i}
                    className={`pdp__thumb${activeImageIdx === i ? " pdp__thumb--active" : ""}`}
                    onClick={() => setActiveImageIdx(i)}
                  >
                    <img src={src} alt={`${product.title} view ${i + 1}`} loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pdp__details">
            <div className="pdp__heading">
              <span className="eyebrow">{product.sector}</span>
              <h1 className="pdp__title">{product.title}</h1>
              <p className="pdp__price">{formatUsd(product.price)}</p>
              {klymeEligible && (
                <span className="pdp__badge mono">
                  Klyme card checkout available
                </span>
              )}
            </div>

            <p className="pdp__summary">{product.description}</p>

            <dl className="pdp__specs">
              {product.specs.map((s) => (
                <div className="pdp__spec" key={s.label}>
                  <dt className="mono">{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>

            <div className="pdp__buy">
              <div
                className="pdp__qty"
                role="group"
                aria-label="Quantity"
              >
                <button
                  type="button"
                  className="pdp__qty-btn"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="pdp__qty-value" aria-live="polite">
                  {qty}
                </span>
                <button
                  type="button"
                  className="pdp__qty-btn"
                  onClick={() => setQty((q) => Math.min(99, q + 1))}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                className="pdp__add"
                onClick={handleAdd}
                data-cursor
              >
                <span>{added ? "Added to cart" : "Add to cart"}</span>
              </button>
            </div>
          </div>
        </div>

        <section className="related">
          <header className="related__head">
            <span className="eyebrow">Related</span>
            <h2 className="related__title">You might also need</h2>
          </header>
          <div className="related__grid">
            {related.map((p) => (
              <a
                key={p.id}
                href={`#/product/${p.id}`}
                className="related__card"
                data-cursor
                data-cursor-text="View"
              >
                <div className="related__media">
                  <img
                    src={p.image}
                    alt={p.title}
                    loading="lazy"
                    style={{
                      transform:
                        "imageShift" in p && p.imageShift
                          ? `translateX(${p.imageShift})`
                          : undefined,
                    }}
                  />
                </div>
                <div className="related__body">
                  <span className="mono related__sector">{p.sector}</span>
                  <h3 className="related__name">{p.title}</h3>
                  <div className="related__row">
                    <span className="related__price">
                      {formatUsd(p.price)}
                    </span>
                    <span className="related__view">View</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
