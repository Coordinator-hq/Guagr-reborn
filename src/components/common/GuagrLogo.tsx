import React from 'react';

interface GuagrLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
}

export const GuagrMark: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({
  className = '',
  size = 'md',
}) => {
  const iconDimensions = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-11 w-11',
    xl: 'h-16 w-16',
  }[size];

  return (
    <div
      className={`relative flex ${iconDimensions} items-center justify-center rounded-2xl bg-gradient-to-br from-[#0062ff] via-[#0068ff] to-[#004ecc] text-white shadow-md shadow-blue-500/25 ${className}`}
    >
      {/* Official Guagr Isolated Circle with Up Arrow Mark */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-3/4 w-3/4"
      >
        {/* Outer Ring */}
        <circle
          cx="50"
          cy="50"
          r="38"
          stroke="currentColor"
          strokeWidth="7.5"
        />
        {/* Upward Arrow Head */}
        <path
          d="M34 44L50 28L66 44"
          stroke="currentColor"
          strokeWidth="7.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Upward Arrow Shaft */}
        <path
          d="M50 28V72"
          stroke="currentColor"
          strokeWidth="7.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export const GuagrLogo: React.FC<GuagrLogoProps> = ({
  className = '',
  size = 'md',
  showWordmark = true,
}) => {
  const textSize = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Isolated Circle with Up Arrow Mark */}
      <GuagrMark size={size} />

      {/* Modern Wordmark Following Platform Design Theme */}
      {showWordmark && (
        <div className="flex items-baseline">
          <span
            className={`font-black tracking-[-0.035em] text-slate-900 ${textSize} leading-none`}
          >
            guagr
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#0062ff] ml-0.5" />
        </div>
      )}
    </div>
  );
};

