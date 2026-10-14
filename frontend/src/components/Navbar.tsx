import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { BrandWordmark } from './BrandWordmark';
import { Button } from './ui/Button';
import { evaluationApi } from '../api/evaluationApi';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isServerOnline, setIsServerOnline] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [startingDemo, setStartingDemo] = useState<boolean>(false);

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
    { to: '/evaluations', label: 'My evaluations' },
    { to: '/dataset', label: 'Dataset' },
  ];

  const handleStartDemo = async () => {
    try {
      setStartingDemo(true);
      const res = await evaluationApi.startDemoEvaluation();
      navigate(`/processing/${res.evaluationId}`);
    } catch (err) {
      console.error('Demo evaluation error:', err);
      navigate('/evaluate');
    } finally {
      setStartingDemo(false);
    }
  };

  return (
    <>
      <header className="h-14 bg-[--surface] border-b border-[--border] relative z-40">
        <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
          {/* Brand mark */}
          <Link to="/" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent] rounded-[4px]">
            <BrandWordmark />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 h-full ml-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`h-full flex items-center text-sm font-medium transition-colors border-b-2 -mb-px px-1 select-none ${
                    isActive
                      ? 'border-[--accent] text-[--text]'
                      : 'border-transparent text-[--text-muted] hover:text-[--text]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-3 ml-auto">
            <Button
              variant="secondary"
              size="sm"
              loading={startingDemo}
              onClick={handleStartDemo}
            >
              Open sample
            </Button>
          </div>

          {/* Mobile menu trigger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-[6px] text-[--text-muted] hover:text-[--text] hover:bg-[--surface-2]"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown panel */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[--surface] border-b border-[--border] px-6 py-4 space-y-3 animate-fadeIn">
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`py-2 text-sm font-medium rounded-[4px] px-2 ${
                      isActive
                        ? 'bg-[--accent-soft] text-[--accent]'
                        : 'text-[--text-muted] hover:text-[--text] hover:bg-[--surface-2]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
            <div className="pt-2 border-t border-[--border]">
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                loading={startingDemo}
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleStartDemo();
                }}
              >
                Open sample
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Offline Alert Banner */}
      {!isServerOnline && (
        <div
          role="status"
          aria-live="polite"
          className="bg-[--warning-soft] border-b border-[--border] px-6 py-2 text-xs text-[#7A5200] flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2 max-w-6xl mx-auto w-full">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[--warning]" />
            <span>
              Can't reach the analysis server. Check that the backend is running on port 8000.
            </span>
            <button
              onClick={checkHealth}
              className="ml-auto inline-flex items-center gap-1 font-semibold underline hover:no-underline"
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
