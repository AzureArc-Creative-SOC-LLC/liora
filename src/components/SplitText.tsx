import { Fragment, createElement, type ElementType, type ReactNode } from "react";

interface SplitTextProps {
  text: string;
  className?: string;
  charClassName?: string;
  lineClassName?: string;
  as?: ElementType;
  ariaLabel?: string;
}

export function SplitText({
  text,
  className,
  charClassName = "char",
  lineClassName = "line",
  as = "span",
  ariaLabel,
}: SplitTextProps) {
  const words = text.split(" ");

  const content: ReactNode[] = [];
  words.forEach((word, wi) => {
    const chars = Array.from(word).map((char, ci) => (
      <span
        className={charClassName}
        key={`${wi}-${ci}`}
        style={{ display: "inline-block", willChange: "transform" }}
      >
        {char}
      </span>
    ));
    content.push(
      <span
        key={`w-${wi}`}
        className="word"
        style={{ display: "inline-block", whiteSpace: "nowrap" }}
      >
        {chars}
      </span>,
    );
    if (wi < words.length - 1) {
      content.push(<Fragment key={`s-${wi}`}>{" "}</Fragment>);
    }
  });

  return createElement(
    as,
    {
      className: `split ${lineClassName} ${className ?? ""}`.trim(),
      "aria-label": ariaLabel ?? text,
    },
    <span aria-hidden style={{ display: "inline-block" }}>
      {content}
    </span>,
  );
}
