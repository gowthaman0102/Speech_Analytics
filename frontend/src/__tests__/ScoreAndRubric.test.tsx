import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScoreGauge } from '../components/ScoreGauge';
import { RubricCard } from '../components/RubricCard';

describe('ScoreGauge Component', () => {
  it('renders score value and label', () => {
    render(<ScoreGauge score={84} label="Overall Score" />);
    expect(screen.getByText('84')).toBeInTheDocument();
    expect(screen.getByText('Overall Score')).toBeInTheDocument();
  });

  it('renders status category badge according to score tiers', () => {
    const { rerender } = render(<ScoreGauge score={92} label="Test" />);
    expect(screen.getByText('Excellent')).toBeInTheDocument();

    rerender(<ScoreGauge score={78} label="Test" />);
    expect(screen.getByText('Competent')).toBeInTheDocument();

    rerender(<ScoreGauge score={62} label="Test" />);
    expect(screen.getByText('Developing')).toBeInTheDocument();

    rerender(<ScoreGauge score={45} label="Test" />);
    expect(screen.getByText('Needs Practice')).toBeInTheDocument();
  });
});

describe('RubricCard Component', () => {
  const sampleRubrics = [
    { category: 'Pacing & Cadence', score: 85, weight: 0.2, description: 'Evaluation of speaking rate cadence' },
    { category: 'Vocal Energy & Projection', score: 72, weight: 0.2, description: 'Evaluation of RMS volume' },
  ];

  it('renders rubric dimensions with scores and weights', () => {
    render(<RubricCard rubricDetails={sampleRubrics} />);
    expect(screen.getByText('Pacing & Cadence')).toBeInTheDocument();
    expect(screen.getByText('Vocal Energy & Projection')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('72')).toBeInTheDocument();
    expect(screen.getAllByText('20%')).toHaveLength(2);
  });
});
