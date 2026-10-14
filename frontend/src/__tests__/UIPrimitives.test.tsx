import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Layers } from 'lucide-react';

describe('UI Primitives', () => {
  it('renders Button with variants and handles click', () => {
    const handleClick = vi.fn();
    render(
      <Button variant="primary" onClick={handleClick}>
        Analyze
      </Button>
    );

    const btn = screen.getByRole('button', { name: /analyze/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables Button when loading', () => {
    render(<Button loading>Processing</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
  });

  it('renders Badge with variants', () => {
    render(<Badge variant="success">Completed</Badge>);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders Card with children', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('renders EmptyState with icon and title', () => {
    render(
      <EmptyState
        icon={Layers}
        title="No items found"
        description="Try adjusting your filters"
      />
    );
    expect(screen.getByText('No items found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
  });
});
