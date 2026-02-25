import React from 'react';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  variant?: 'full' | 'icon';
  className?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ variant = 'full', className }) => {
  const monogram = (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", variant === 'icon' ? "h-8 w-8" : "h-9 w-9")}
    >
      {/* Shield shape background */}
      <path
        d="M20 2L4 10V22C4 31.05 11.16 39.42 20 38C28.84 39.42 36 31.05 36 22V10L20 2Z"
        className="fill-[#0B1F3B] dark:fill-[#C8A951]"
      />
      {/* Inner border */}
      <path
        d="M20 4.5L6 11.5V22C6 29.85 12.36 37.1 20 36C27.64 37.1 34 29.85 34 22V11.5L20 4.5Z"
        fill="none"
        className="stroke-[#C8A951] dark:stroke-[#0B1F3B]"
        strokeWidth="0.75"
      />
      {/* PL monogram */}
      <text
        x="20"
        y="24.5"
        textAnchor="middle"
        className="fill-[#C8A951] dark:fill-[#0B1F3B]"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="700"
        fontSize="15"
        letterSpacing="1"
      >
        PL
      </text>
    </svg>
  );

  if (variant === 'icon') {
    return <div className={cn("flex items-center justify-center", className)}>{monogram}</div>;
  }

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {monogram}
      <div className="flex flex-col leading-none select-none">
        <span className="text-[14px] font-bold tracking-[0.08em] text-sidebar-foreground uppercase" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          PRIVATE
        </span>
        <span className="text-[10.5px] font-semibold tracking-[0.18em] text-sidebar-foreground/60 uppercase" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          LENDING 360
        </span>
      </div>
    </div>
  );
};

export default BrandLogo;
