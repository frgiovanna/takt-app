import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Input } from '../Input';
import { ProductivityBadge } from '../ProductivityBadge';

describe('Design System Components', () => {
  test('Card renders children content', () => {
    render(<Card>Hello Card</Card>);
    expect(screen.getByText('Hello Card')).toBeInTheDocument();
  });

  test('Button clicks and triggers event', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    const btn = screen.getByRole('button', { name: /Click Me/i });
    expect(btn).toBeInTheDocument();
    
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('Input value updates and displays label', () => {
    const handleChange = vi.fn();
    render(<Input label="Username" placeholder="Enter username" onChange={handleChange} />);
    
    expect(screen.getByText('Username')).toBeInTheDocument();
    
    const input = screen.getByPlaceholderText('Enter username') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    
    fireEvent.change(input, { target: { value: 'john_doe' } });
    expect(handleChange).toHaveBeenCalled();
  });

  test('ProductivityBadge displays default and custom labels', () => {
    const { rerender } = render(<ProductivityBadge level={4} />);
    expect(screen.getByText('Altamente Produtivo')).toBeInTheDocument();
    
    rerender(<ProductivityBadge level={1} customLabel="Muito Ruim" />);
    expect(screen.getByText('Muito Ruim')).toBeInTheDocument();
  });
});
