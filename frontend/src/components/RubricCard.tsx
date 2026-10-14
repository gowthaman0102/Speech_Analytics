import React from 'react';
import { RubricScoreItem } from '../types';

interface RubricCardProps {
  rubricDetails: RubricScoreItem[];
}

export const RubricCard: React.FC<RubricCardProps> = ({ rubricDetails }) => {
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-500 text-emerald-400';
    if (score >= 70) return 'bg-cyan-500 text-cyan-400';
    if (score >= 55) return 'bg-amber-500 text-amber-400';
    return 'bg-rose-500 text-rose-400';
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Rubric-Based Evaluation Breakdown</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Deterministic scores computed across 6 distinct acoustic signal dimensions
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-950 text-slate-300 border border-slate-800">
          Total: 100 Pts
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rubricDetails.map((item) => {
          const score = Math.round(item.score);
          const colors = getScoreColor(score);
          const [bgColor, textColor] = colors.split(' ');

          return (
            <div
              key={item.category}
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="font-semibold text-sm text-slate-200">{item.category}</h4>
                  <span className={`text-base font-black font-mono ${textColor}`}>
                    {score}
                    <span className="text-[11px] text-slate-500 font-normal">/100</span>
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-2.5">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${bgColor}`}
                    style={{ width: `${score}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                <span>Rubric Weight:</span>
                <span className="font-semibold text-slate-300">{Math.round(item.weight * 100)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
