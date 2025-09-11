/**
 * Tests for DeleteConfirmationModal component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeleteConfirmationModal } from '../../src/components/modal/DeleteConfirmationModal';

describe('DeleteConfirmationModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    entityName: 'Test Entity',
    entityType: 'Section',
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly when open', () => {
    render(<DeleteConfirmationModal {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
    expect(screen.getByText(/are you sure you want to delete the section/i)).toBeInTheDocument();
    expect(screen.getByText('"Test Entity"')).toBeInTheDocument();
    expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<DeleteConfirmationModal {...defaultProps} open={false} />);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('displays warning when provided', () => {
    const warning = 'This will affect other components';
    render(<DeleteConfirmationModal {...defaultProps} warning={warning} />);

    expect(screen.getByText(warning)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked', () => {
    const onClose = vi.fn();
    render(<DeleteConfirmationModal {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when delete is clicked', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<DeleteConfirmationModal {...defaultProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByText('Delete'));
    
    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  it('shows loading state when loading prop is true', () => {
    render(<DeleteConfirmationModal {...defaultProps} loading={true} />);

    expect(screen.getByText('Deleting...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /deleting/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });

  it('prevents closing when loading', () => {
    const onClose = vi.fn();
    render(<DeleteConfirmationModal {...defaultProps} loading={true} onClose={onClose} />);

    // Try to close via escape key
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('has proper accessibility attributes', () => {
    render(<DeleteConfirmationModal {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'delete-confirmation-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'delete-confirmation-description');
    
    expect(screen.getByRole('heading', { name: /confirm deletion/i })).toHaveAttribute('id', 'delete-confirmation-title');
    expect(screen.getByText(/are you sure you want to delete/i)).toHaveAttribute('id', 'delete-confirmation-description');
  });

  it('handles onConfirm error gracefully', async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error('Delete failed'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<DeleteConfirmationModal {...defaultProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByText('Delete'));
    
    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith('Delete confirmation error:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
});