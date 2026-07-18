"use client";

import { useEffect, useState } from "react";

const DEEP_LINK = "reversemarket://seller/stripe/refresh";

export default function StripeRefresh() {
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRedirecting(true);
      window.location.href = DEEP_LINK;
    }, 1500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main>
      <div className="card">
        <div className="logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
          </svg>
        </div>
        <p className="brand">Sorcyn</p>
        <div className="status-icon" aria-hidden="true">
          ↻
        </div>
        <h1>Let’s finish your Stripe setup</h1>
        <p>
          Stripe needs another step before you can receive payouts. Reopen
          Sorcyn and tap “Setup payouts” to continue.{" "}
          {redirecting ? "Opening Sorcyn…" : ""}
        </p>
        <a className="cta" href={DEEP_LINK}>
          Return to Sorcyn
        </a>
        <p className="hint">
          If nothing happens, tap the button above or reopen Sorcyn manually.
        </p>
      </div>
    </main>
  );
}
