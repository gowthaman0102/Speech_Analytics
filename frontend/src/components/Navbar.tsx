import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, AlertTriangle, RefreshCw, Plus } from 'lucide-react';
import { BrandWordmark } from './BrandWordmark';
import { Button } from './ui/Button';
import { evaluationApi } from '../api/evaluationApi';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [isServerOnline, setIsServerOnline] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const checkHealth = async () => {
    try {
      await evaluationApi.getHealth();
      setIsServerOnline(true);
    } catch {
      setIsServerOnline(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  // Poll only when server is offline every 15s
  useEffect(() => {
    if (isServerOnline) return;
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [isServerOnline]);

  const navLinks = [
    { to: '/', label: 'Overview' },
    { to: '/evaluate', label: 'New evaluation' },
    { to: '/dataset', label: 'Sample recordings' },
    { to: '/evaluations', label: 'History' },
  ];

  return (
    <>
      <header className="h-16 bg-surface border-b border-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
          {/* Brand mark */}
          <Link to="/" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg">
            <BrandWordmark />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 h-full ml-10">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`h-full flex items-center text-sm font-semibold transition-colors border-b-2 -mb-px px-1 select-none ${
                    isActive
                      ? 'border-accent text-accent'
                      : 'border-transparent text-text-muted hover:text-text'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Primary Action: New evaluation */}
          <div className="hidden md:flex items-center gap-3 ml-auto">
            <Link to="/evaluate">
              <Button variant="primary" size="sm" className="gap-1.5 shadow-xs">
                <Plus className="h-4 w-4" />
                <span>New evaluation</span>
              </Button>
            </Link>
          </div>

          {/* Mobile menu trigger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-surface-2"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown panel */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-surface border-b border-border px-6 py-4 space-y-3 animate-fadeIn">
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`py-2 text-sm font-semibold rounded-xl px-3 ${
                      isActive
                        ? 'bg-accent-soft text-accent-text'
                        : 'text-text-muted hover:text-text hover:bg-surface-2'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
            <div className="pt-2 border-t border-border">
              <Link to="/evaluate" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" size="sm" className="w-full gap-1.5">
                  <Plus className="h-4 w-4" />
                  <span>New evaluation</span>
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Offline Alert Banner */}
      {!isServerOnline && (
        <div
          role="status"
          aria-live="polite"
          className="bg-warning-soft border-b border-border px-6 py-2.5 text-xs text-warning flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2 max-w-6xl mx-auto w-full">
            <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
            <span>
              Can't reach the analysis server. Check that the backend is running on port 8000.
            </span>
            <button
              onClick={checkHealth}
              className="ml-auto inline-flex items-center gap-1 font-semibold underline hover:no-underline cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
