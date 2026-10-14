import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrandWordmark } from '../components/BrandWordmark';
import { BRAND } from '../config/brand';

describe('BrandWordmark Component', () => {
  it('renders "SpeechScope" and never "SpeechScope AI"', () => {
    render(<BrandWordmark />);
    expect(screen.getByText('SpeechScope')).toBeInTheDocument();
    expect(screen.queryByText(/AI/i)).not.toBeInTheDocument();
  });

  it('matches brand configuration name', () => {
    expect(BRAND.name).toBe('SpeechScope');
    expect(BRAND.name).not.toContain('AI');
  });
});
