import React from 'react';

interface GuagrLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const GuagrLogo: React.FC<GuagrLogoProps> = ({ className = '', size = 'md' }) => {
  const iconDimensions = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-11 w-11',
  }[size];

  const textSize = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  }[size];

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* Dynamic Geometric 'g' Wager Monogram */}
      <div
        className={`relative flex ${iconDimensions} items-center justify-center rounded-2xl bg-gradient-to-br from-[#0062ff] via-[#0077ff] to-[#00c8ff] text-white shadow-md shadow-blue-500/20`}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-5/6 w-5/6 p-0.5"
        >
          <defs>
            <linearGradient id="guagrGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0.85" />
            </linearGradient>
          </defs>

          {/* Main outer predictive arc */}
          <path
            d="M21 11.5A7.5 7.5 0 1 0 21 19.5H13"
            stroke="url(#guagrGlow)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Directional momentum wager arrow terminal on the g */}
          <path
            d="M17.5 7.5L22 11.5L17.5 15.5"
            stroke="url(#guagrGlow)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Core focal pulse dot */}
          <circle cx="13.5" cy="15.5" r="2" fill="#ffffff" />
        </svg>
      </div>

      {/* Modern Typographic Wordmark */}
      <div className="flex items-baseline">
        <span
          className={`font-black tracking-[-0.04em] text-[#0062ff] ${textSize} leading-none`}
          style={{ letterSpacing: '-0.04em' }}
        >
          guagr
        </span>
        <span className="h-1.5 w-1.5 rounded-full bg-[#00d0ff] ml-0.5 animate-pulse" />
      </div>
    </div>
  );
};
