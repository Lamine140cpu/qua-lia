interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
  variant?: 'default' | 'light' | 'dark';
}

export function LogoMark({ size = 36 }: { size?: number }) {
  const id = `logo-grad-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Qual'IA logo"
    >
      <defs>
        {/* Main radial gradient */}
        <radialGradient id={`${id}-bg`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="55%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>
        {/* Glow on border */}
        <linearGradient id={`${id}-border`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.6" />
        </linearGradient>
        {/* Sparkle gradient */}
        <linearGradient id={`${id}-spark`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        {/* Inner shine */}
        <radialGradient id={`${id}-shine`} cx="30%" cy="25%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Badge background — rounded square */}
      <rect x="1" y="1" width="38" height="38" rx="11" fill={`url(#${id}-bg)`} />

      {/* Inner shine overlay */}
      <rect x="1" y="1" width="38" height="38" rx="11" fill={`url(#${id}-shine)`} />

      {/* Border */}
      <rect x="1" y="1" width="38" height="38" rx="11" stroke={`url(#${id}-border)`} strokeWidth="1" fill="none" />

      {/* ── Letter Q ── */}
      {/* Circle of Q */}
      <circle cx="19" cy="20" r="9.5" stroke="white" strokeWidth="2.4" fill="none" opacity="0.95" />
      {/* Tail of Q — angled stroke bottom-right */}
      <line x1="25.5" y1="26" x2="30" y2="31" stroke="white" strokeWidth="2.4" strokeLinecap="round" opacity="0.95" />

      {/* ── IA accent — top-right sparkle ── */}
      {/* Center dot */}
      <circle cx="31" cy="10" r="1.6" fill={`url(#${id}-spark)`} />
      {/* 4 rays */}
      <line x1="31" y1="6.5" x2="31" y2="8.2" stroke={`url(#${id}-spark)`} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="31" y1="11.8" x2="31" y2="13.5" stroke={`url(#${id}-spark)`} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="27.5" y1="10" x2="29.2" y2="10" stroke={`url(#${id}-spark)`} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="32.8" y1="10" x2="34.5" y2="10" stroke={`url(#${id}-spark)`} strokeWidth="1.2" strokeLinecap="round" />
      {/* Diagonal rays (smaller) */}
      <line x1="28.8" y1="7.8" x2="29.9" y2="8.9" stroke={`url(#${id}-spark)`} strokeWidth="0.9" strokeLinecap="round" opacity="0.7" />
      <line x1="32.1" y1="11.1" x2="33.2" y2="12.2" stroke={`url(#${id}-spark)`} strokeWidth="0.9" strokeLinecap="round" opacity="0.7" />
      <line x1="32.1" y1="7.8" x2="33.2" y2="6.8" stroke={`url(#${id}-spark)`} strokeWidth="0.9" strokeLinecap="round" opacity="0.7" />
      <line x1="28.8" y1="12.2" x2="29.9" y2="11.1" stroke={`url(#${id}-spark)`} strokeWidth="0.9" strokeLinecap="round" opacity="0.7" />

      {/* Small dot accent bottom-left — subtle detail */}
      <circle cx="9" cy="30" r="1" fill="#60a5fa" opacity="0.4" />
    </svg>
  );
}

export function Logo({ size = 36, showWordmark = true, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      {showWordmark && (
        <span
          className="text-xl font-bold tracking-tight"
          style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.02em' }}
        >
          <span className="text-foreground">Qual</span>
          <span
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            'IA
          </span>
        </span>
      )}
    </div>
  );
}
