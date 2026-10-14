import React from 'react';
import { Link } from 'react-router-dom';
import { BRAND } from '../config/brand';

export const Footer: React.FC = () => {
  return (
    <footer className="no-print mt-auto border-t border-[--border] bg-[--surface] py-6 text-xs text-[--text-muted]">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="font-normal">
          © {BRAND.year} {BRAND.name}. {BRAND.tagline}
        </p>
        <div className="flex items-center gap-5">
          <Link to="/dataset" className="hover:text-[--text] transition-colors">
            Dataset
          </Link>
          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[--text] transition-colors"
          >
            API Docs
          </a>
        </div>
      </div>
    </footer>
  );
};
