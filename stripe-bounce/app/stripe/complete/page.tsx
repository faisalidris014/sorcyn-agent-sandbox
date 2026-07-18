"use client";

import { useEffect, useState } from "react";

const DEEP_LINK = "reversemarket://seller/stripe/complete";

export default function StripeComplete() {
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
          ✓
        </div>
        <h1>Stripe setup complete</h1>
        <p>
          Your Stripe account is connected. You can now receive payouts when
          buyers approve your work.{" "}
          {redirecting
            ? "Opening Sorcyn…"
            : "We’re sending you back to the app."}
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
