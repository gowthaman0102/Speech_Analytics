import React from 'react';
import { BRAND } from '../config/brand';

interface BrandWordmarkProps {
  className?: string;
  showTagline?: boolean;
}

export const BrandWordmark: React.FC<BrandWordmarkProps> = ({ className = '', showTagline = false }) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* 5-bar abstract waveform mark in terracotta accent */}
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-accent shrink-0"
        aria-hidden="true"
      >
        <rect x="2" y="9" width="2.5" height="6" rx="1.25" fill="currentColor" />
        <rect x="6.5" y="5" width="2.5" height="14" rx="1.25" fill="currentColor" />
        <rect x="11" y="2" width="2.5" height="20" rx="1.25" fill="currentColor" />
        <rect x="15.5" y="7" width="2.5" height="10" rx="1.25" fill="currentColor" />
        <rect x="20" y="10" width="2.5" height="4" rx="1.25" fill="currentColor" />
      </svg>
      <div>
        <span className="sr-only">{BRAND.name}</span>
        <span aria-hidden="true" className="font-extrabold text-base tracking-tight text-text">
          Speech<span className="text-accent">Scope</span>
        </span>
        {showTagline && (
          <p className="text-xs text-text-muted font-normal leading-tight">
            {BRAND.tagline}
          </p>
        )}
      </div>
    </div>
  );
};
