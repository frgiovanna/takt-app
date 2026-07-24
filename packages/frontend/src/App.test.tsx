import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import App from './App';

describe('App login screen', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders the simple login form for unauthenticated users', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Takt' })).toBeInTheDocument();
    expect(screen.getByLabelText('Usuário')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha de acesso')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar no Takt' })).toBeInTheDocument();
  });
});
