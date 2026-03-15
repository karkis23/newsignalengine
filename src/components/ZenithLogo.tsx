
interface ZenithLogoProps {
  size?: number;
  className?: string;
}

export default function ZenithLogo({ size = 44, className = "" }: ZenithLogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logo-grad-main" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        
        <linearGradient id="logo-grad-accent" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-light)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="var(--accent-light)" stopOpacity="0.2" />
        </linearGradient>

        <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer Prism Frame */}
      <path 
        d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" 
        fill="var(--bg-elevated)" 
        stroke="url(#logo-grad-main)" 
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />

      {/* The Letter Z - Conceptual geometric design */}
      <g filter="url(#logo-glow)">
        {/* Top diagonal segment */}
        <path 
          d="M25 35 L75 35 L35 65" 
          stroke="url(#logo-grad-main)" 
          strokeWidth="8" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        
        {/* Bottom diagonal segment */}
        <path 
          d="M65 35 L25 65 L75 65" 
          stroke="url(#logo-grad-main)" 
          strokeWidth="8" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        
        {/* Sharp corner accent */}
        <path 
          d="M75 35 L35 65" 
          stroke="white" 
          strokeWidth="2" 
          strokeOpacity="0.5" 
          strokeLinecap="round"
        />
      </g>

      {/* Central Spark / Node */}
      <circle cx="50" cy="50" r="4" fill="white" style={{ filter: 'drop-shadow(0 0 5px var(--accent-light))' }} />
      
      {/* Dynamic Accents */}
      <circle cx="90" cy="25" r="2" fill="var(--accent-light)" opacity="0.6" />
      <circle cx="10" cy="75" r="2" fill="var(--accent-light)" opacity="0.6" />
    </svg>
  );
}
