interface LogoProps {
  size?: number;
  withWordmark?: boolean;
}

export function Logo({ size = 32, withWordmark = false }: LogoProps) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.625rem" }}>
      <div
        className="gradient-icon"
        style={{
          width: size,
          height: size,
          boxShadow: "0 6px 16px rgba(124, 58, 237, 0.32)",
        }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{ width: size * 0.5, height: size * 0.5 }}
        >
          <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
        </svg>
      </div>
      {withWordmark && (
        <span
          style={{
            fontWeight: 700,
            fontSize: size * 0.5,
            letterSpacing: "-0.01em",
          }}
        >
          Sorcyn
        </span>
      )}
    </div>
  );
}
