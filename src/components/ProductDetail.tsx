import { useEffect, useMemo, useRef, useState } from "react";
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

type TabKey = "package" | "storage" | "supply";

export function ProductDetail({ id }: Props) {
  const product = projects.find((p) => p.id === id);
  const { navigate } = useRouter();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [klymeEligible, setKlymeEligible] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("package");
  const [certOpen, setCertOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const root = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setActiveImageIdx(0);
    setActiveTab("package");
    const hasLab = !!(product && "labAnalysis" in product && product.labAnalysis);
    setAnalysisOpen(hasLab);
    setCertOpen(false);
  }, [id, product]);

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

  useEffect(() => {
    const anyOpen = certOpen || analysisOpen;
    if (!anyOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (certOpen) setCertOpen(false);
      else if (analysisOpen) setAnalysisOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [certOpen, analysisOpen]);

  const labAnalysis = useMemo(
    () =>
      product && "labAnalysis" in product
        ? (product as { labAnalysis?: LabAnalysis }).labAnalysis
        : undefined,
    [product]
  );

  const packageContents =
    product && "packageContents" in product
      ? (product as { packageContents?: string[] }).packageContents
      : undefined;
  const storageLogic =
    product && "storageLogic" in product
      ? (product as { storageLogic?: string[] }).storageLogic
      : undefined;
  const supplyChain =
    product && "supplyChain" in product
      ? (product as { supplyChain?: string[] }).supplyChain
      : undefined;
  const safetyProtocol =
    product && "safetyProtocol" in product
      ? (product as { safetyProtocol?: string }).safetyProtocol
      : undefined;

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

  const tabContent: Record<TabKey, string[] | undefined> = {
    package: packageContents,
    storage: storageLogic,
    supply: supplyChain,
  };

  const activeTabItems = tabContent[activeTab];

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
              <h1 className="pdp__title">{product.title} (R&amp;D Only)</h1>
              <p className="pdp__price">{formatUsd(product.price)}</p>
              {klymeEligible && (
                <span className="pdp__badge mono">
                  Klyme card checkout available
                </span>
              )}
            </div>

            <p className="pdp__summary">{product.description}</p>

            {safetyProtocol && (
              <p className="pdp__safety">
                <strong>Safety Protocol:</strong> {safetyProtocol}
              </p>
            )}

            {labAnalysis && (
              <>
                <button
                  type="button"
                  className="pdp__cert-link"
                  onClick={() => setCertOpen(true)}
                  data-cursor
                  aria-haspopup="dialog"
                >
                  <span className="pdp__cert-link-dot" aria-hidden />
                  View Janoshik Analytical Report
                </button>

                <section className="lab" aria-label="Lab analysis">
                  <header className="lab__head">
                    <h3 className="lab__title">Janoshik Third-Party Lab Analysis</h3>
                    <p className="lab__sub">
                      Independently tested and verified by {labAnalysis.lab}.
                    </p>
                  </header>
                  <dl className="lab__meta">
                    <div className="lab__meta-item">
                      <dt>Batch Number</dt>
                      <dd>{labAnalysis.batchNumber}</dd>
                    </div>
                    <div className="lab__meta-item">
                      <dt>Fill Volume</dt>
                      <dd>{labAnalysis.fillVolume}</dd>
                    </div>
                    {labAnalysis.purity && (
                      <div className="lab__meta-item">
                        <dt>Purity</dt>
                        <dd>{labAnalysis.purity}</dd>
                      </div>
                    )}
                  </dl>
                  <div className="lab__table-wrap">
                    <table className="lab__table">
                      <thead>
                        <tr>
                          <th scope="col">Compound</th>
                          <th scope="col">Concentration</th>
                          <th scope="col">Verified Content</th>
                        </tr>
                      </thead>
                      <tbody>
                        {labAnalysis.compounds.map((c) => (
                          <tr key={c.name}>
                            <td>{c.name}</td>
                            <td>{c.concentration}</td>
                            <td>{c.verified}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="lab__note">
                    Concentration is measured per ml; verified content reflects
                    the total assayed mass across the stated fill volume.
                  </p>
                </section>
              </>
            )}

            {(packageContents || storageLogic || supplyChain) && (
              <div className="pdp__tabs">
                <div className="pdp__tabs-nav" role="tablist" aria-label="Product details">
                  {packageContents && (
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === "package"}
                      className={`pdp__tab${activeTab === "package" ? " pdp__tab--active" : ""}`}
                      onClick={() => setActiveTab("package")}
                    >
                      Package Contents
                    </button>
                  )}
                  {storageLogic && (
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === "storage"}
                      className={`pdp__tab${activeTab === "storage" ? " pdp__tab--active" : ""}`}
                      onClick={() => setActiveTab("storage")}
                    >
                      Storage Logic
                    </button>
                  )}
                  {supplyChain && (
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === "supply"}
                      className={`pdp__tab${activeTab === "supply" ? " pdp__tab--active" : ""}`}
                      onClick={() => setActiveTab("supply")}
                    >
                      Supply Chain
                    </button>
                  )}
                </div>
                {activeTabItems && (
                  <ul className="pdp__tab-panel" role="tabpanel">
                    {activeTabItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

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

      {analysisOpen && labAnalysis && (
        <div
          className="analysis-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`Janoshik lab analysis for ${product.title}`}
          onClick={() => setAnalysisOpen(false)}
        >
          <div
            className="analysis-modal__panel"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="analysis-modal__close"
              onClick={() => setAnalysisOpen(false)}
              aria-label="Close lab analysis"
            >
              ×
            </button>

            <div className="analysis-modal__icon" aria-hidden>
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 3h6" />
                <path d="M10 3v6.5L4.5 18a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 9.5V3" />
                <path d="M7.5 14h9" />
              </svg>
            </div>

            <h2 className="analysis-modal__title">Janoshik Third-Party Lab Analysis</h2>
            <p className="analysis-modal__sub">
              Independently tested and verified by {labAnalysis.lab}.
            </p>

            <dl className="analysis-modal__meta">
              <div className="analysis-modal__meta-item">
                <dt>Batch Number</dt>
                <dd>{labAnalysis.batchNumber}</dd>
              </div>
              <div className="analysis-modal__meta-item">
                <dt>Fill Volume</dt>
                <dd>{labAnalysis.fillVolume}</dd>
              </div>
              {labAnalysis.purity && (
                <div className="analysis-modal__meta-item analysis-modal__meta-item--accent">
                  <dt>Purity</dt>
                  <dd>{labAnalysis.purity}</dd>
                </div>
              )}
            </dl>

            <div className="analysis-modal__table-wrap">
              <table className="analysis-modal__table">
                <thead>
                  <tr>
                    <th scope="col">Compound</th>
                    <th scope="col">Concentration</th>
                    <th scope="col">Verified Content</th>
                  </tr>
                </thead>
                <tbody>
                  {labAnalysis.compounds.map((c) => (
                    <tr key={c.name}>
                      <td>{c.name}</td>
                      <td>{c.concentration}</td>
                      <td>{c.verified}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="analysis-modal__note">
              Concentration is measured per ml; verified content reflects the
              total assayed mass across the stated fill volume.
            </p>

            <button
              type="button"
              className="analysis-modal__cta"
              onClick={() => {
                setAnalysisOpen(false);
                setCertOpen(true);
              }}
            >
              View Full Janoshik Report
            </button>
          </div>
        </div>
      )}

      {certOpen && labAnalysis && (
        <div
          className="cert-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`Janoshik certificate for ${product.title}`}
          onClick={() => setCertOpen(false)}
        >
          <div
            className="cert-modal__panel"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="cert-modal__head">
              <div>
                <span className="mono cert-modal__eyebrow">Certificate of Analysis</span>
                <h2 className="cert-modal__title">
                  {product.title} · Janoshik Report
                </h2>
              </div>
              <button
                type="button"
                className="cert-modal__close"
                onClick={() => setCertOpen(false)}
                aria-label="Close certificate"
              >
                ×
              </button>
            </header>

            <div className="cert-modal__body">
              <div className="cert-modal__meta">
                <div className="cert-modal__meta-item">
                  <span className="mono">Batch</span>
                  <strong>{labAnalysis.batchNumber}</strong>
                </div>
                <div className="cert-modal__meta-item">
                  <span className="mono">Fill Volume</span>
                  <strong>{labAnalysis.fillVolume}</strong>
                </div>
                {labAnalysis.purity && (
                  <div className="cert-modal__meta-item">
                    <span className="mono">Purity</span>
                    <strong>{labAnalysis.purity}</strong>
                  </div>
                )}
                <div className="cert-modal__meta-item">
                  <span className="mono">Lab</span>
                  <strong>{labAnalysis.lab}</strong>
                </div>
              </div>

              <div className="cert-modal__images">
                <figure className="cert-modal__report">
                  <img
                    src={labAnalysis.reportImages[0]}
                    alt={`Janoshik test report for ${product.title}`}
                  />
                  <figcaption className="mono">Full analytical report</figcaption>
                </figure>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type LabAnalysis = {
  lab: string;
  batchNumber: string;
  fillVolume: string;
  purity?: string;
  compounds: { name: string; concentration: string; verified: string }[];
  reportUrl?: string;
  reportImages: string[];
};
