import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Radio, PlusCircle, Database, Sparkles, CheckCircle2 } from 'lucide-react';
import { evaluationApi } from '../api/evaluationApi';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [online, setOnline] = useState<boolean>(true);

  useEffect(() => {
    evaluationApi.getHealth()
      .then(() => setOnline(true))
      .catch(() => setOnline(false));
  }, []);

  const navLinks = [
    { to: '/', label: 'Overview', icon: Activity },
    { to: '/evaluate', label: 'New Evaluation', icon: PlusCircle },
    { to: '/dataset', label: 'Dataset Explorer', icon: Database },
  ];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80 px-6 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-cyan-500 to-emerald-400 p-[2px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Radio className="h-5 w-5 text-cyan-400 group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                SpeechScope AI
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                COACH
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Temporal Contrastive Speech Coach</p>
          </div>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-slate-800/90 text-white shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}

          <Link
            to="/evaluate?demo=true"
            className="flex items-center gap-2 ml-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white shadow-md shadow-indigo-500/20 hover:shadow-cyan-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Sparkles className="h-4 w-4" />
            <span>Try Demo</span>
          </Link>

          <div className="ml-3 pl-3 border-l border-slate-800 flex items-center gap-2 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                online ? 'bg-emerald-400 shadow-sm shadow-emerald-400/80 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="text-slate-400 hidden md:inline">{online ? 'Engine Active' : 'Connecting...'}</span>
          </div>
        </div>
      </div>
    </nav>
  );
};
