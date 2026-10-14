import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Skeleton } from './components/ui/Skeleton';

// Code-split page routes
const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const NewEvaluationPage = lazy(() => import('./pages/NewEvaluationPage').then((m) => ({ default: m.NewEvaluationPage })));
const ProcessingPage = lazy(() => import('./pages/ProcessingPage').then((m) => ({ default: m.ProcessingPage })));
const ResultsPage = lazy(() => import('./pages/ResultsPage').then((m) => ({ default: m.ResultsPage })));
const DatasetPage = lazy(() => import('./pages/DatasetPage').then((m) => ({ default: m.DatasetPage })));
const HistoryPage = lazy(() => import('./pages/HistoryPage').then((m) => ({ default: m.HistoryPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

const PageLoader = () => (
  <div className="max-w-4xl mx-auto px-6 py-16 space-y-4">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-4 w-96" />
    <Skeleton className="h-64 w-full mt-6" />
  </div>
);

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="min-h-screen bg-[var(--bg)] text-[var(--foreground)] flex flex-col font-sans antialiased selection:bg-[var(--accent)] selection:text-white">
          <Navbar />

          <main className="flex-1">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/evaluate" element={<NewEvaluationPage />} />
                <Route path="/processing/:id" element={<ProcessingPage />} />
                <Route path="/results/:id" element={<ResultsPage />} />
                <Route path="/dataset" element={<DatasetPage />} />
                <Route path="/evaluations" element={<HistoryPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </main>

          <Footer />
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
