import { useState } from "react";
import clsx from "clsx";
import { faqItems } from "../data/site";
import faqImg from "../assets/researcher.jpeg";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="container section faq">
      <header className="faq__head">
        <span className="eyebrow">FAQ</span>
        <h2 className="h2 faq__title">Frequently asked questions.</h2>
      </header>

      <div className="faq__layout">
        <figure className="faq__media" data-cursor data-cursor-text="Lab">
          <img src={faqImg} alt="Research team in the lab" loading="lazy" />
        </figure>

        <div className="faq__list">
          {faqItems.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                className={clsx("faq__item", isOpen && "is-open")}
                key={item.question}
              >
                <button
                  className="faq__trigger"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                >
                  <span className="faq__q">{item.question}</span>
                  <span className="faq__chevron" aria-hidden>
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M6 9l6 6 6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>
                <div className="faq__panel">
                  <div className="faq__panel-inner">
                    <p className="faq__answer">{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
