"use client";

import { useEffect, useState } from "react";
import { SMS_MAX_CHARS } from "@/lib/types";

interface HeroDeliveryVisualProps {
  message: string;
}

export function HeroDeliveryVisual({ message }: HeroDeliveryVisualProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setAnimate(true), 1400);
    return () => clearTimeout(timer);
  }, []);

  const active = animate ? "delivery-compose--animate" : "";

  return (
    <div className={`delivery-stage ${active}`} aria-hidden="true">
      <div className={`delivery-compose ${active}`}>
        <div className="delivery-letter-slide">
          <div className="delivery-letter-sheet">
            <p className="delivery-letter-label">Today&apos;s letter</p>
            <p className="delivery-letter-body">{message}</p>
            <span className="delivery-letter-meta">
              {message.length}/{SMS_MAX_CHARS} chars
            </span>
          </div>
        </div>

        <div
          className={`delivery-envelope ${animate ? "delivery-envelope--animate" : ""}`}
        >
          <div className="delivery-envelope-3d">
            <div className="delivery-envelope-back" />
            <div className="delivery-envelope-side delivery-envelope-side--left" />
            <div className="delivery-envelope-side delivery-envelope-side--right" />
            <div className="delivery-envelope-pocket" />

            <div className="delivery-envelope-flap">
              <div className="delivery-envelope-flap-face" />
            </div>

            <div className="delivery-envelope-stamp">
              <span>ب</span>
            </div>
            <div className="delivery-envelope-seal" />
          </div>
        </div>
      </div>
    </div>
  );
}
