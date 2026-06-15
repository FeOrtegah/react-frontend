import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Input from '../components/atoms/Input';

describe('Input Component', () => {
  it('should render input element', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should set placeholder', () => {
    render(<Input placeholder="Enter username" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'Enter username');
  });

  it('should set value', () => {
    render(<Input value="test value" onChange={vi.fn()} />);
    expect(screen.getByRole('textbox')).toHaveValue('test value');
  });

  it('should call onChange when input changes', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Input value="" onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'hello');

    expect(handleChange).toHaveBeenCalled();
  });

  it('should support different input types', () => {
    const { container } = render(<Input type="password" />);
    const input = container.querySelector('input[type="password"]');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('should default to text type', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
  });

  it('should support required attribute', () => {
    render(<Input required />);
    expect(screen.getByRole('textbox')).toHaveAttribute('required');
  });

  it('should have correct styling', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');

    expect(input.style.width).toBe('100%');
    expect(input.style.padding).toBe('12px 16px');
    expect(input.style.borderRadius).toBe('8px');
    expect(input.style.border).toBe('1px solid #ddd');
    expect(input.style.fontSize).toBe('15px');
    expect(input.style.boxSizing).toBe('border-box');
  });

  it('should support email type', () => {
    render(<Input type="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
  });

  it('should support number type', () => {
    render(<Input type="number" />);
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });
});
