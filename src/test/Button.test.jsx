import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Button from '../components/atoms/Button';

describe('Button Component', () => {
  it('should render with children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('should handle onClick event', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button');
    button.click();
    
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('should set type attribute', () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('should default to button type', () => {
    render(<Button>Click</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should not be disabled by default', () => {
    render(<Button>Not disabled</Button>);
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('should apply fullWidth style when prop is true', () => {
    render(<Button fullWidth>Full Width</Button>);
    const button = screen.getByRole('button');
    expect(button.style.width).toBe('100%');
  });

  it('should have auto width by default', () => {
    render(<Button>Auto Width</Button>);
    const button = screen.getByRole('button');
    expect(button.style.width).toBe('auto');
  });

  it('should have correct styling', () => {
    render(<Button>Styled</Button>);
    const button = screen.getByRole('button');
    
    expect(button.style.padding).toBe('12px 24px');
    expect(button.style.borderRadius).toBe('8px');
    expect(button.style.color).toBe('white');
    expect(button.style.fontSize).toBe('15px');
    expect(button.style.fontWeight).toBe('bold');
  });

  it('should show correct cursor style based on disabled state', () => {
    const { rerender } = render(<Button>Enabled</Button>);
    let button = screen.getByRole('button');
    expect(button.style.cursor).toBe('pointer');

    rerender(<Button disabled>Disabled</Button>);
    button = screen.getByRole('button');
    expect(button.style.cursor).toBe('not-allowed');
  });
});
