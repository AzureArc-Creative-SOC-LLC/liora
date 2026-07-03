import { useState, type FormEvent } from "react";
import clsx from "clsx";
import { site } from "../data/site";
import { useMagnetic } from "../hooks/useMagnetic";

type Status = "idle" | "sending" | "sent" | "error";

export function Contact() {
  const [status, setStatus] = useState<Status>("idle");
  const submitRef = useMagnetic<HTMLButtonElement>(0.25);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());

    if (!payload.email || !payload.message) {
      setStatus("error");
      return;
    }

    setStatus("sending");
    await new Promise((r) => setTimeout(r, 900));
    setStatus("sent");
    form.reset();
  };

  return (
    <section id="contact" className="contact">
      <div className="container contact__grid">
        <div>
          <span className="eyebrow">Contact</span>
          <h2 className="contact__heading" style={{ marginTop: "1.5rem" }}>
            Place an order or ask a question.
          </h2>
          <p className="contact__body">
            Tell us what you need — a single vial, a recurring lab supply, or a
            quote for a custom catalogue. We reply by email or WhatsApp within
            a working day.
          </p>

          <ul className="contact__channels">
            <li>
              <span className="mono">WhatsApp</span>
              <a
                href={site.whatsapp}
                target="_blank"
                rel="noreferrer"
                data-cursor
                data-cursor-text="Chat"
              >
                {site.phone}
              </a>
            </li>
            <li>
              <span className="mono">Email</span>
              <a
                href={`mailto:${site.email}`}
                data-cursor
                data-cursor-text="Email"
              >
                {site.email}
              </a>
            </li>
            <li>
              <span className="mono">Facility</span>
              <span>{site.location}</span>
            </li>
          </ul>
        </div>

        <form className="form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="name">Name or organisation</label>
            <input id="name" name="name" type="text" autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="message">Order details or question</label>
            <textarea id="message" name="message" rows={4} required />
          </div>
          <button
            type="submit"
            className="btn form__submit"
            disabled={status === "sending"}
            data-cursor
            data-cursor-text="Send"
            ref={submitRef}
          >
            {status === "sending" ? "Sending…" : "Send enquiry"}
          </button>
          {status === "sent" && (
            <p className="form__status">
              Sent — we'll reply within one working day.
            </p>
          )}
          {status === "error" && (
            <p className={clsx("form__status", "is-error")}>
              Please add an email and a short message.
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
