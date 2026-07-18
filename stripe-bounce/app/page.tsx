export default function Home() {
  return (
    <main>
      <div className="card">
        <div className="logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
          </svg>
        </div>
        <p className="brand">Sorcyn</p>
        <h1>Stripe Connect bounce service</h1>
        <p>
          This page is the HTTPS return target Stripe redirects sellers to after
          completing or refreshing their Stripe Connect onboarding. It then
          deep-links back to the Sorcyn mobile app.
        </p>
      </div>
    </main>
  );
}
