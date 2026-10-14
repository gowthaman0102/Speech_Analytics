import React from 'react';
import { Link } from 'react-router-dom';
import { BRAND } from '../config/brand';

export const Footer: React.FC = () => {
  return (
    <footer className="no-print mt-auto border-t border-border bg-surface py-8 text-xs text-text-muted">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="font-medium text-center sm:text-left">
          © {BRAND.year} {BRAND.name} — {BRAND.tagline}
        </p>
        <div className="flex items-center gap-6 font-semibold">
          <Link to="/" className="hover:text-text transition-colors">
            Overview
          </Link>
          <Link to="/evaluate" className="hover:text-text transition-colors">
            New evaluation
          </Link>
          <Link to="/dataset" className="hover:text-text transition-colors">
            Sample recordings
          </Link>
        </div>
      </div>
    </footer>
  );
};
