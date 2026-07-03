import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { site } from "../data/site";
import { useRouter } from "../hooks/useRouter";
import { ApiError, subscribeNewsletter } from "../lib/api";

type SubscribeStatus = "idle" | "loading" | "success" | "error";

export function Footer() {
  const ref = useRef<HTMLElement | null>(null);
  const { view, navigate } = useRouter();

  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<SubscribeStatus>("idle");
  const [message, setMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;
    const value = email.trim();
    if (!value) {
      setStatus("error");
      setMessage("Please enter your email address.");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const res = await subscribeNewsletter({
        email: value,
        consent: true,
        source: "footer_newsletter",
        website,
      });
      setStatus("success");
      setMessage(
        res.already_subscribed
          ? "You're already on the list — thanks!"
          : "You're subscribed. Watch your inbox.",
      );
      setEmail("");
    } catch (err) {
      setStatus("error");
      if (err instanceof ApiError && err.status === 429) {
        setMessage(
          "You've hit the signup limit for this hour. Please try again a bit later.",
        );
      } else {
        setMessage(
          err instanceof ApiError
            ? err.message
            : "Something went wrong. Please try again.",
        );
      }
    }
  };

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

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.to(".footer__big", {
        yPercent: -10,
        ease: "none",
        scrollTrigger: {
          trigger: ref.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    }, ref);
    return () => {
      ctx.revert();
      ScrollTrigger.refresh();
    };
  }, []);

  return (
    <footer className="footer" ref={ref}>
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand-block">
            <div className="footer__brand-name">
              <span className="footer__brand-primary">{site.brandMark}</span>
              <span className="footer__brand-accent">{site.brandSub}</span>
            </div>
            <p className="footer__tagline">{site.role}</p>

            <form className="footer__subscribe" onSubmit={handleSubscribe} noValidate>
              <h4 className="footer__col-title mono">Stay updated</h4>
              <div className="footer__subscribe-row">
                <input
                  type="email"
                  className="footer__subscribe-input"
                  placeholder="you@lab.com"
                  aria-label="Email address"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-cursor
                />
                {/* Honeypot — hidden from users, catches bots */}
                <input
                  type="text"
                  className="footer__subscribe-hp"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
                <button
                  type="submit"
                  className="footer__subscribe-btn"
                  disabled={status === "loading"}
                  data-cursor
                >
                  {status === "loading" ? "…" : "Subscribe"}
                </button>
              </div>
              {message ? (
                <p
                  className={`footer__subscribe-msg footer__subscribe-msg--${status}`}
                  role="status"
                  aria-live="polite"
                >
                  {message}
                </p>
              ) : (
                <p className="footer__subscribe-note">
                  Research updates and restock alerts. No spam.
                </p>
              )}
            </form>
          </div>

          <div className="footer__col">
            <h4 className="footer__col-title mono">Quick Links</h4>
            <ul className="footer__links">
              {site.navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    data-cursor
                    onClick={(e) => {
                      e.preventDefault();
                      goToSection(link.href);
                    }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer__col">
            <h4 className="footer__col-title mono">Contact</h4>
            <ul className="footer__links">
              <li>
                <a href={`mailto:${site.email}`} data-cursor>
                  {site.email}
                </a>
              </li>
              <li>
                <a
                  href={site.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  data-cursor
                >
                  {site.phone}
                </a>
              </li>
              <li>
                <span>{site.location}</span>
              </li>
            </ul>
          </div>

          <div className="footer__col">
            <h4 className="footer__col-title mono">Follow</h4>
            <ul className="footer__socials">
              {site.socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    data-cursor
                    data-cursor-text="Open"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer__divider" aria-hidden />

        <div className="footer__row">
          <div className="footer__meta">
            © {new Date().getFullYear()} {site.name}
          </div>
          <div className="footer__meta">{site.location}</div>
        </div>

        <p className="footer__disclaimer">
          All products are supplied strictly for laboratory research and
          educational use. Not intended for human or veterinary consumption.
          Buyer is responsible for ensuring compliance with all applicable
          local laws and regulations.
        </p>
        <div className="footer__big" aria-hidden>
          {site.name}
        </div>
      </div>
    </footer>
  );
}
