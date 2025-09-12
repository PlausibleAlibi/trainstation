import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import VirtualTrackLayout from '../src/VirtualTrackLayout';

describe('VirtualTrackLayout Component', () => {
  it('should render without crashing', () => {
    render(<VirtualTrackLayout />);
    expect(screen.getByText('Virtual Track Layout')).toBeInTheDocument();
  });

  it('should display track sections', () => {
    render(<VirtualTrackLayout />);
    
    // Check that the component description is present
    expect(screen.getByText('Interactive track layout showing sections, switches, and accessories.')).toBeInTheDocument();
  });

  it('should display legend with accessory types', () => {
    render(<VirtualTrackLayout />);
    
    // Check for legend
    expect(screen.getByText('Legend')).toBeInTheDocument();
    expect(screen.getByText('Track Sections')).toBeInTheDocument();
    expect(screen.getByText('Switches')).toBeInTheDocument();
    expect(screen.getByText('Signal')).toBeInTheDocument();
    expect(screen.getByText('Yard Light')).toBeInTheDocument();
    expect(screen.getByText('Station House')).toBeInTheDocument();
  });

  it('should render SVG track layout', () => {
    const { container } = render(<VirtualTrackLayout />);
    
    // Check that SVG element is present
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '600');
    expect(svg).toHaveAttribute('height', '400');
  });

  it('should export as default', () => {
    expect(VirtualTrackLayout).toBeDefined();
    expect(typeof VirtualTrackLayout).toBe('function');
  });
});