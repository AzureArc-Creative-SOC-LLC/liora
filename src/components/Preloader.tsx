import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

interface PreloaderProps {
  onComplete: () => void;
}

const stages = [
  "Booting interface",
  "Loading assets",
  "Preparing motion",
  "Finalizing",
];

export function Preloader({ onComplete }: PreloaderProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const [percent, setPercent] = useState(0);
  const [stage, setStage] = useState(stages[0]);

  useEffect(() => {
    const progress = { value: 0 };
    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      onComplete: () => {
        gsap.to(rootRef.current, {
          yPercent: -100,
          duration: 0.9,
          ease: "power3.inOut",
          delay: 0.2,
          onComplete,
        });
      },
    });

    stages.forEach((label, i) => {
      const target = ((i + 1) / stages.length) * 100;
      tl.call(() => setStage(label));
      tl.to(progress, {
        value: target,
        duration: 0.6 + Math.random() * 0.5,
        onUpdate: () => {
          setPercent(Math.round(progress.value));
          if (fillRef.current) {
            fillRef.current.style.transform = `scaleX(${progress.value / 100})`;
          }
        },
      });
      tl.to({}, { duration: 0.15 + Math.random() * 0.25 });
    });

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div className="preloader" ref={rootRef} aria-hidden>
      <div className="container preloader__inner">
        <div className="preloader__stage">{stage}</div>
        <div className="preloader__count">
          {String(percent).padStart(3, "0")} / 100
        </div>
        <div className="preloader__percent">{percent}%</div>
        <div className="preloader__bar">
          <div className="preloader__fill" ref={fillRef} />
        </div>
      </div>
    </div>
  );
}
