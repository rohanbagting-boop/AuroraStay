import '@testing-library/jest-dom/vitest';
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { PasswordRequirements } from './pages/AuthPages.jsx';

afterEach(() => {
  cleanup();
});

describe('PasswordRequirements component', () => {
  it('renders all 4 requirement labels when empty', () => {
    render(<PasswordRequirements password="" />);
    expect(screen.getByText(/At least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/One lowercase letter \(a-z\)/i)).toBeInTheDocument();
    expect(screen.getByText(/One uppercase letter \(A-Z\)/i)).toBeInTheDocument();
    expect(screen.getByText(/One number \(0-9\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Password requirements/i)).toBeInTheDocument();
  });

  it('marks lowercase rule as valid when lowercase is typed', () => {
    const { container } = render(<PasswordRequirements password="abc" />);
    const lowerItem = screen.getByText(/One lowercase letter \(a-z\)/i).closest('li');
    expect(lowerItem).toHaveClass('valid');

    const upperItem = screen.getByText(/One uppercase letter \(A-Z\)/i).closest('li');
    expect(upperItem).not.toHaveClass('valid');
  });

  it('marks all rules as valid when a strong compliant password is typed', () => {
    const { container } = render(<PasswordRequirements password="AuroraStay123" />);
    const items = container.querySelectorAll('.passwordValidationItem');
    items.forEach((item) => {
      expect(item).toHaveClass('valid');
    });
    expect(screen.getByText(/Strong & ready/i)).toBeInTheDocument();
  });
});
