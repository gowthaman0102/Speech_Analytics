import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProcessingStepper } from '../components/ProcessingStepper';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

// Mock API call in Navbar
vi.mock('../api/evaluationApi', () => ({
  evaluationApi: {
    getHealth: vi.fn().mockResolvedValue({ status: 'ok' }),
  },
}));

describe('Terracotta Coach Redesign & Cleanup Tests', () => {
  it('ProcessingStepper renders exactly 5 plain-English stages with zero technical jargon', () => {
    render(<ProcessingStepper progress={50} status="PROCESSING" />);

    expect(screen.getByText('Preparing your audio')).toBeInTheDocument();
    expect(screen.getByText('Listening to the speech')).toBeInTheDocument();
    expect(screen.getByText('Measuring delivery')).toBeInTheDocument();
    expect(screen.getByText('Finding flagged moments')).toBeInTheDocument();
    expect(screen.getByText('Scoring')).toBeInTheDocument();

    // Verify absence of internal DSP / engine jargon
    expect(screen.queryByText(/Faster-Whisper/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ASR/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/F0/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/DTW/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Warp/i)).not.toBeInTheDocument();
  });

  it('Navbar contains clean navigation links and removes "Open sample" button', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getAllByText('New evaluation').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Sample recordings')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();

    // "Open sample" duplicate demo button must be removed from Navbar
    expect(screen.queryByText(/Open sample/i)).not.toBeInTheDocument();
  });

  it('Footer removes API Docs and displays human coach tagline', () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );

    expect(screen.queryByText(/API Docs/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Speech delivery analytics for coaches and speakers/i)).toBeInTheDocument();
  });
});
