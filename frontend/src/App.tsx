import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { NewEvaluationPage } from './pages/NewEvaluationPage';
import { ProcessingPage } from './pages/ProcessingPage';
import { ResultsPage } from './pages/ResultsPage';
import { DatasetPage } from './pages/DatasetPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
        <Navbar />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/evaluate" element={<NewEvaluationPage />} />
            <Route path="/processing/:id" element={<ProcessingPage />} />
            <Route path="/results/:id" element={<ResultsPage />} />
            <Route path="/dataset" element={<DatasetPage />} />
          </Routes>
        </main>

        <footer className="border-t border-slate-900 bg-slate-950/80 py-8 px-6 text-center text-xs text-slate-500">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>
              <strong className="text-slate-400">SpeechScope AI</strong> — Counterpointing Speech Analytics & Temporal Flaw Finding
            </p>
            <div className="flex items-center gap-4 text-slate-500">
              <span>Dynamic Time Warping (DTW)</span>
              <span>•</span>
              <span>faster-whisper</span>
              <span>•</span>
              <span>librosa acoustics</span>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
