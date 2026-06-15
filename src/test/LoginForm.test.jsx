import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '../components/molecules/LoginForm';

vi.mock('../api', () => ({
  fetchUsuarioPorUsername: vi.fn(),
}));

import * as api from '../api';

describe('LoginForm Component', () => {
  const mockOnLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnLogin.mockClear();
    localStorage.getItem.mockReturnValue(null);
  });

  it('should render login form with username and password inputs', () => {
    render(<LoginForm onLogin={mockOnLogin} />);

    expect(screen.getByPlaceholderText('Usuario')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument();
  });

  it('should render submit button', () => {
    render(<LoginForm onLogin={mockOnLogin} />);
    expect(screen.getByRole('button', { name: /Ingresar/i })).toBeInTheDocument();
  });

  it('should handle successful login', async () => {
    const user = userEvent.setup();
    const mockUsuario = {
      id: 1,
      username: 'testuser',
      credenciales: { password: 'password123' },
    };

    api.fetchUsuarioPorUsername.mockResolvedValueOnce(mockUsuario);

    render(<LoginForm onLogin={mockOnLogin} />);

    const usernameInput = screen.getByPlaceholderText('Usuario');
    const passwordInput = screen.getByPlaceholderText('Contraseña');
    const submitButton = screen.getByRole('button', { name: /Ingresar/i });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(api.fetchUsuarioPorUsername).toHaveBeenCalledWith('testuser');
      expect(mockOnLogin).toHaveBeenCalledWith(mockUsuario);
    });
  });

  it('should show error when password is incorrect', async () => {
    const user = userEvent.setup();
    const mockUsuario = {
      id: 1,
      username: 'testuser',
      credenciales: { password: 'password123' },
    };

    api.fetchUsuarioPorUsername.mockResolvedValueOnce(mockUsuario);

    render(<LoginForm onLogin={mockOnLogin} />);

    const usernameInput = screen.getByPlaceholderText('Usuario');
    const passwordInput = screen.getByPlaceholderText('Contraseña');
    const submitButton = screen.getByRole('button', { name: /Ingresar/i });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Contraseña incorrecta')).toBeInTheDocument();
      expect(mockOnLogin).not.toHaveBeenCalled();
    });
  });

  it('should show error when user not found', async () => {
    const user = userEvent.setup();
    const error = new Error('Error 404: Not Found');
    error.status = 404;

    api.fetchUsuarioPorUsername.mockRejectedValueOnce(error);

    render(<LoginForm onLogin={mockOnLogin} />);

    const usernameInput = screen.getByPlaceholderText('Usuario');
    const passwordInput = screen.getByPlaceholderText('Contraseña');
    const submitButton = screen.getByRole('button', { name: /Ingresar/i });

    await user.type(usernameInput, 'nonexistent');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Usuario no encontrado')).toBeInTheDocument();
      expect(mockOnLogin).not.toHaveBeenCalled();
    });
  });

  it('should show server error on API failure', async () => {
    const user = userEvent.setup();
    const error = new Error('Network error');

    api.fetchUsuarioPorUsername.mockRejectedValueOnce(error);

    render(<LoginForm onLogin={mockOnLogin} />);

    const usernameInput = screen.getByPlaceholderText('Usuario');
    const passwordInput = screen.getByPlaceholderText('Contraseña');
    const submitButton = screen.getByRole('button', { name: /Ingresar/i });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Error al conectar con el servidor')).toBeInTheDocument();
      expect(mockOnLogin).not.toHaveBeenCalled();
    });
  });

  it('should show loading state while submitting', async () => {
    const user = userEvent.setup();
    const mockUsuario = {
      id: 1,
      username: 'testuser',
      credenciales: { password: 'password123' },
    };

    api.fetchUsuarioPorUsername.mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve(mockUsuario), 100))
    );

    render(<LoginForm onLogin={mockOnLogin} />);

    const usernameInput = screen.getByPlaceholderText('Usuario');
    const passwordInput = screen.getByPlaceholderText('Contraseña');
    const submitButton = screen.getByRole('button', { name: /Ingresar/i });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(screen.getByRole('button', { name: /Iniciando sesión/i })).toBeInTheDocument();
  });

  it('should disable button while loading', async () => {
    const user = userEvent.setup();
    const mockUsuario = {
      id: 1,
      username: 'testuser',
      credenciales: { password: 'password123' },
    };

    api.fetchUsuarioPorUsername.mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve(mockUsuario), 100))
    );

    render(<LoginForm onLogin={mockOnLogin} />);

    const usernameInput = screen.getByPlaceholderText('Usuario');
    const passwordInput = screen.getByPlaceholderText('Contraseña');
    const submitButton = screen.getByRole('button', { name: /Ingresar/i });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
  });

  it('should clear error message on new submission', async () => {
    const user = userEvent.setup();
    const mockUsuario = {
      id: 1,
      username: 'testuser',
      credenciales: { password: 'password123' },
    };

    // First attempt with wrong password
    api.fetchUsuarioPorUsername.mockResolvedValueOnce(mockUsuario);

    render(<LoginForm onLogin={mockOnLogin} />);

    const usernameInput = screen.getByPlaceholderText('Usuario');
    const passwordInput = screen.getByPlaceholderText('Contraseña');
    const submitButton = screen.getByRole('button', { name: /Ingresar/i });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Contraseña incorrecta')).toBeInTheDocument();
    });

    // Second attempt with correct password
    api.fetchUsuarioPorUsername.mockResolvedValueOnce(mockUsuario);

    await user.clear(passwordInput);
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText('Contraseña incorrecta')).not.toBeInTheDocument();
      expect(mockOnLogin).toHaveBeenCalled();
    });
  });
});
