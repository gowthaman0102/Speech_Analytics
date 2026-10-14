import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SentenceAnalysisView } from '../components/SentenceAnalysisView';
import type { SentenceAnalysisItem } from '../types';

describe('SentenceAnalysisView Component', () => {
  const sampleSentences: SentenceAnalysisItem[] = [
    {
      sentence_index: 1,
      text: 'Good morning everyone, today I would like to speak about the power of dreams.',
      start_time: 0.0,
      end_time: 4.2,
      duration: 4.2,
      primary_intent: 'motivational',
      role: 'Opening',
      compatibility_score: 63,
    },
    {
      sentence_index: 2,
      text: 'Every great achievements begins with a small dream.',
      start_time: 4.8,
      end_time: 7.2,
      duration: 2.4,
      primary_intent: 'motivational',
      role: 'Body',
      compatibility_score: 60,
    },
  ];

  it('renders sentence list and triggers onPlaySentence when play button is clicked', () => {
    const handlePlaySentence = vi.fn();
    const handlePause = vi.fn();

    render(
      <SentenceAnalysisView
        sentences={sampleSentences}
        onPlaySentence={handlePlaySentence}
        onPause={handlePause}
        isPlaying={false}
        currentTime={0}
      />
    );

    expect(screen.getByText(/power of dreams/i)).toBeInTheDocument();

    const playButtons = screen.getAllByRole('button', { name: /play sentence/i });
    expect(playButtons).toHaveLength(2);

    // Click play on Sentence 1
    fireEvent.click(playButtons[0]);
    expect(handlePlaySentence).toHaveBeenCalledWith(0.0, 4.2, 0);

    // Click play on Sentence 2
    fireEvent.click(playButtons[1]);
    expect(handlePlaySentence).toHaveBeenCalledWith(4.8, 7.2, 1);
  });

  it('shows Pause icon and triggers onPause when active playing sentence is clicked', () => {
    const handlePlaySentence = vi.fn();
    const handlePause = vi.fn();

    // Render as Sentence 1 currently playing
    render(
      <SentenceAnalysisView
        sentences={sampleSentences}
        onPlaySentence={handlePlaySentence}
        onPause={handlePause}
        isPlaying={true}
        currentTime={2.0} // within sentence 1 (0.0 to 4.2)
      />
    );

    // Should display Playing indicator
    expect(screen.getByText('Playing')).toBeInTheDocument();

    // The active sentence button should have aria-label "Pause sentence 1"
    const pauseButton = screen.getByRole('button', { name: /pause sentence 1/i });
    expect(pauseButton).toBeInTheDocument();

    fireEvent.click(pauseButton);
    expect(handlePause).toHaveBeenCalledTimes(1);
  });
});
