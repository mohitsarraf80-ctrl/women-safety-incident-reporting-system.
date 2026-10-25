import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AlertStatusBadge, AvailabilityBadge, PriorityBadge, StatusBadge } from './Badge';

describe('badges', () => {
  it('renders the priority label without relying on colour alone', () => {
    render(<PriorityBadge priority="CRITICAL" />);
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
  });

  it('renders a readable status label', () => {
    render(<StatusBadge status="UNDER_REVIEW" label="Under review" />);
    expect(screen.getByText('Under review')).toBeInTheDocument();
  });

  it('renders responder availability', () => {
    render(<AvailabilityBadge availability="AVAILABLE" />);
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('labels simulated alerts explicitly', () => {
    render(<AlertStatusBadge status="SIMULATED" />);
    expect(screen.getByText('Simulated')).toBeInTheDocument();
  });
});
