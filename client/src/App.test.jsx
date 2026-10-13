import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

vi.mock('./services/api.js', () => ({
  api: {
    get: vi.fn((url) => {
      if (url.startsWith('/auth/me')) return Promise.reject(new Error('no session'));
      if (url.startsWith('/rooms')) return Promise.resolve({ data: { data: [] } });
      if (url.startsWith('/room-types')) return Promise.resolve({ data: { data: [] } });
      return Promise.resolve({ data: { data: null } });
    }),
    post: vi.fn()
  }
}));

describe('App', () => {
  it('renders the public homepage', async () => {
    render(<BrowserRouter><AuthProvider><App /></AuthProvider></BrowserRouter>);
    expect(await screen.findByRole('heading', { name: /Calm city stays/i })).toBeInTheDocument();
  });
});

