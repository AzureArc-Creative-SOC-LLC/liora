import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { gsap } from "gsap";
import { site } from "../data/site";
import { useCart } from "../hooks/useCart";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "../hooks/useRouter";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const targetIndex = hoverIndex !== null ? hoverIndex : activeIndex;
  const { totalQty, open: openCart } = useCart();
  const { account } = useAuth();
  const { view, navigate } = useRouter();

  const goToSection = (href: string) => {
    const scrollToTarget = () => {
      if (href === "#home") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    if (view.name === "home") {
      scrollToTarget();
    } else {
      navigate({ name: "home" });
      window.setTimeout(scrollToTarget, 120);
    }
  };

  const linksRef = useRef<Array<HTMLAnchorElement | null>>([]);
  const indicatorRef = useRef<HTMLSpanElement | null>(null);
  const indicatorInited = useRef(false);

  useEffect(() => {
    document.body.classList.toggle("scroll-lock", open);
    return () => document.body.classList.remove("scroll-lock");
  }, [open]);

  useEffect(() => {
    const sections = site.navLinks
      .map((l) => document.querySelector(l.href))
      .filter((el): el is HTMLElement => el instanceof HTMLElement);

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = sections.findIndex((s) => s === entry.target);
            if (idx !== -1) setActiveIndex(idx);
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const link = linksRef.current[targetIndex];
    const indicator = indicatorRef.current;
    if (!link || !indicator) return;

    const measure = () => {
      const x = link.offsetLeft;
      const width = link.offsetWidth;
      if (!indicatorInited.current) {
        gsap.set(indicator, { x, width, opacity: 1 });
        indicatorInited.current = true;
      } else {
        gsap.to(indicator, {
          x,
          width,
          duration: 0.45,
          ease: "power3.out",
        });
      }
    };

    measure();
    const id = requestAnimationFrame(measure);

    const onResize = () => {
      const l = linksRef.current[targetIndex];
      if (!l || !indicator) return;
      gsap.set(indicator, { x: l.offsetLeft, width: l.offsetWidth });
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", onResize);
    };
  }, [targetIndex]);

  return (
    <>
      <header className="nav">
        <div className="container nav__row">
        <a
          className="nav__brand"
          href="#home"
          data-cursor
          aria-label={site.name}
          onClick={(e) => {
            e.preventDefault();
            goToSection("#home");
          }}
        >
          <span className="nav__logo" aria-hidden>
            <svg viewBox="0 0 32 32" fill="none">
              <path
                d="M10 16 L21 9"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M10 16 L21 23"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <circle cx="10" cy="16" r="4.2" fill="currentColor" />
              <circle cx="22" cy="8.5" r="3" fill="currentColor" />
              <circle cx="22" cy="23.5" r="3" fill="currentColor" />
            </svg>
          </span>
          <span className="nav__brand-name">
            <span className="nav__brand-primary">{site.brandMark}</span>
            <span className="nav__brand-divider" aria-hidden />
            <span className="nav__brand-accent">{site.brandSub}</span>
          </span>
        </a>

        <nav>
          <ul
            className="nav__links"
            onMouseLeave={() => setHoverIndex(null)}
          >
            <span
              className="nav__indicator"
              ref={indicatorRef}
              aria-hidden
            />
            {site.navLinks.map((link, i) => (
              <li key={link.href}>
                <a
                  ref={(el) => {
                    linksRef.current[i] = el;
                  }}
                  className={clsx(
                    "nav__link",
                    i === targetIndex && "is-target",
                  )}
                  href={link.href}
                  data-cursor
                  onMouseEnter={() => setHoverIndex(i)}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveIndex(i);
                    goToSection(link.href);
                  }}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="nav__actions">
          <button
            className="nav__account"
            onClick={() =>
              navigate({ name: account ? "account" : "login" })
            }
            aria-label={account ? "Your account" : "Sign in"}
            data-cursor
            data-cursor-text={account ? "Account" : "Sign in"}
            type="button"
          >
            <svg
              className="nav__account-icon"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <circle
                cx="12"
                cy="8.5"
                r="3.75"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path
                d="M4.75 20.25c0-3.59 3.25-6.5 7.25-6.5s7.25 2.91 7.25 6.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <button
            className="nav__cart"
            onClick={openCart}
            aria-label={`Open cart, ${totalQty} item${totalQty === 1 ? "" : "s"}`}
            data-cursor
            data-cursor-text="Cart"
            type="button"
          >
            <svg
              className="nav__cart-icon"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M4 6h2.2l2.4 10.2a2 2 0 0 0 1.95 1.55h7.6a2 2 0 0 0 1.95-1.55L21.5 9H7.2"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="10.5" cy="20.25" r="1.25" fill="currentColor" />
              <circle cx="17.5" cy="20.25" r="1.25" fill="currentColor" />
            </svg>
            {totalQty > 0 && (
              <span className="nav__cart-badge" aria-hidden>
                {totalQty}
              </span>
            )}
          </button>

          <button
            className="nav__toggle"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            data-cursor
          >
            <span aria-hidden />
          </button>
        </div>
        </div>
      </header>

      <div className={clsx("nav__drawer", open && "is-open")} aria-hidden={!open}>
        <button
          className="nav__drawer-close"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        >
          ×
        </button>
        <ul className="nav__drawer-list">
          {site.navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  setOpen(false);
                  goToSection(link.href);
                }}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
