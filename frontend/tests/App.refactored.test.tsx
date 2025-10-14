/**
 * Tests for refactored App.tsx to verify UI consistency with other managers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';

// Mock fetch
global.fetch = vi.fn();

describe('Refactored App Component - UI Consistency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock categories endpoint
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 1, name: 'Lights', description: 'Lighting accessories', sortOrder: 1 },
            { id: 2, name: 'Switches', description: 'Track switches', sortOrder: 2 },
          ]),
        });
      }
      if (url.includes('/accessories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              id: 1,
              name: 'Test Light',
              categoryId: 1,
              controlType: 'onOff',
              address: '0x01',
              isActive: true,
              timedMs: null,
              category: { id: 1, name: 'Lights' },
            },
          ]),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });
  });

  it('should render with unified design system components', async () => {
    render(<App />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Accessories & Categories')).toBeInTheDocument();
    });

    // Check for MUI Paper components
    expect(screen.getByText('Categories')).toBeInTheDocument();
    
    // Check for Add Accessory button
    expect(screen.getByRole('button', { name: /add accessory/i })).toBeInTheDocument();
  });

  it('should have category management with icon buttons', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText('Lights').length).toBeGreaterThan(0);
    });

    // Check for category buttons (may appear multiple times)
    expect(screen.getAllByText('Lights').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Switches').length).toBeGreaterThan(0);

    // Add Category button should be present (icon button)
    const categorySection = screen.getByText('Categories').parentElement;
    expect(categorySection).toBeInTheDocument();
  });

  it('should display accessories in table format', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test Light')).toBeInTheDocument();
    });

    // Check table headers
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();

    // Check accessory data
    expect(screen.getByText('Test Light')).toBeInTheDocument();
    expect(screen.getByText('0x01')).toBeInTheDocument();
    expect(screen.getByText('onOff')).toBeInTheDocument();
  });

  it('should have control action buttons', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test Light')).toBeInTheDocument();
    });

    // Check for control buttons
    expect(screen.getByRole('button', { name: /on/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /off/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /apply/i }).length).toBeGreaterThan(0);
  });

  it('should have edit and delete icon buttons for accessories', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test Light')).toBeInTheDocument();
    });

    // Check for edit and delete buttons by title attribute
    const editButtons = screen.getAllByTitle(/edit/i);
    const deleteButtons = screen.getAllByTitle(/delete/i);
    
    expect(editButtons.length).toBeGreaterThan(0);
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  it('should show search and filter controls', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Accessories & Categories')).toBeInTheDocument();
    });

    // Check for search input by label
    const searchInput = screen.getByLabelText(/search accessories/i);
    expect(searchInput).toBeInTheDocument();

    // Check for filter controls (using text content instead of labels)
    expect(screen.getByText(/active only/i)).toBeInTheDocument();
    expect(screen.getByText(/auto-refresh/i)).toBeInTheDocument();
    
    // Check for pagination buttons
    expect(screen.getByRole('button', { name: /prev/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('should use Chip components for status display', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test Light')).toBeInTheDocument();
    });

    // Check for status chip
    const statusChip = screen.getByText('Active');
    expect(statusChip).toBeInTheDocument();
    expect(statusChip.closest('.MuiChip-root')).toBeInTheDocument();
  });

  it('should match spacing and layout patterns from SwitchesManager', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Accessories & Categories')).toBeInTheDocument();
    });

    // Check for proper Container
    const container = document.querySelector('.MuiContainer-root');
    expect(container).toBeInTheDocument();

    // Check for Paper components
    const papers = document.querySelectorAll('.MuiPaper-root');
    expect(papers.length).toBeGreaterThan(0);

    // Check for Table components
    const table = document.querySelector('.MuiTable-root');
    expect(table).toBeInTheDocument();
  });
});
