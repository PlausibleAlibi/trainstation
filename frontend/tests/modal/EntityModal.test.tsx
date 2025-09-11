/**
 * Basic tests for EntityModal component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EntityModal } from '../../src/components/modal/EntityModal';
import type { ModalConfig } from '../../src/components/types';

describe('EntityModal', () => {
  const mockConfig: ModalConfig = {
    title: 'Test Entity',
    fields: [
      {
        name: 'name',
        label: 'Name',
        type: 'text',
        required: true,
      },
    ],
  };

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    config: mockConfig,
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders create modal correctly', () => {
    render(<EntityModal {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Create Test Entity')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
  });

  it('renders edit modal correctly', () => {
    render(<EntityModal {...defaultProps} isEditing={true} />);

    expect(screen.getByText('Edit Test Entity')).toBeInTheDocument();
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<EntityModal {...defaultProps} loading={true} />);

    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('displays error message', () => {
    const error = 'Something went wrong';
    render(<EntityModal {...defaultProps} error={error} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(error)).toBeInTheDocument();
  });
});