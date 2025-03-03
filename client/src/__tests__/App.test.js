import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import axios from 'axios';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};

  return {
    getItem(key) {
      return store[key] || null;
    },
    setItem(key, value) {
      store[key] = value.toString();
    },
    clear() {
      store = {};
    },
    removeItem(key) {
      delete store[key];
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock axios successful connection response
jest.mock('axios');

describe('App Component', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear();
    // Default to dark mode
    window.localStorage.setItem('themeMode', 'dark');
    // Reset all mocks
    jest.clearAllMocks();
  });

  test('renders connection form when not connected', () => {
    render(<App />);
    expect(screen.getByText(/Connect to PostgreSQL Database/i)).toBeInTheDocument();
  });

  test('theme toggle button is present', () => {
    render(<App />);
    const themeButton = screen.getByRole('button', { name: /toggle theme/i });
    expect(themeButton).toBeInTheDocument();
  });

  test('toggles theme from dark to light when theme button is clicked', () => {
    window.localStorage.setItem('themeMode', 'dark');
    render(<App />);
    const themeButton = screen.getByRole('button', { name: /toggle theme/i });
    
    // Initial state is dark
    expect(window.localStorage.getItem('themeMode')).toBe('dark');
    
    // Click to toggle
    fireEvent.click(themeButton);
    
    // Should now be light
    expect(window.localStorage.getItem('themeMode')).toBe('light');
  });

  test('toggles theme from light to dark when theme button is clicked', () => {
    window.localStorage.setItem('themeMode', 'light');
    render(<App />);
    const themeButton = screen.getByRole('button', { name: /toggle theme/i });
    
    // Initial state is light
    expect(window.localStorage.getItem('themeMode')).toBe('light');
    
    // Click to toggle
    fireEvent.click(themeButton);
    
    // Should now be dark
    expect(window.localStorage.getItem('themeMode')).toBe('dark');
  });

  test('loads stored theme preference from localStorage', () => {
    // Set theme preference
    window.localStorage.setItem('themeMode', 'light');
    
    render(<App />);
    
    // Light theme shows dark mode icon (moon)
    const themeButton = screen.getByRole('button', { name: /toggle theme/i });
    expect(themeButton).toBeInTheDocument();
    expect(themeButton.querySelector('svg[data-testid="Brightness4Icon"]')).toBeInTheDocument();
  });

  test('transitions to database view after successful connection', async () => {
    // Mock successful connection
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    
    render(<App />);
    
    // Fill in the form fields
    userEvent.type(screen.getByLabelText(/Host/i), 'localhost');
    userEvent.type(screen.getByLabelText(/Port/i), '5432');
    userEvent.type(screen.getByLabelText(/Database/i), 'testdb');
    userEvent.type(screen.getByLabelText(/Username/i), 'postgres');
    userEvent.type(screen.getByLabelText(/Password/i), 'password');
    
    // Submit the form
    const connectButton = screen.getByRole('button', { name: /Connect/i });
    userEvent.click(connectButton);
    
    // Check if connection was attempted with correct data
    expect(axios.post).toHaveBeenCalledWith('/api/connect', expect.objectContaining({
      host: 'localhost',
      port: '5432',
      database: 'testdb',
      user: 'postgres',
      password: 'password'
    }));
    
    // Verify we transition to the database view
    await waitFor(() => {
      expect(screen.getByText(/Database Explorer/i)).toBeInTheDocument();
      expect(screen.getByText(/SQL Query/i)).toBeInTheDocument();
    });
  });

  test('app layout contains correct components after connection', async () => {
    // Mock successful connection
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    
    render(<App />);
    
    // Fill in minimal required fields
    userEvent.type(screen.getByLabelText(/Database/i), 'testdb');
    userEvent.type(screen.getByLabelText(/Username/i), 'postgres');
    
    // Submit the form
    const connectButton = screen.getByRole('button', { name: /Connect/i });
    userEvent.click(connectButton);
    
    // Check for main UI components
    await waitFor(() => {
      // Sidebar
      expect(screen.getByText(/Database Explorer/i)).toBeInTheDocument();
      
      // Query editor
      expect(screen.getByText(/SQL Query/i)).toBeInTheDocument();
      expect(screen.getByText(/Execute Query/i)).toBeInTheDocument();
      
      // Editor should be present (via our mock)
      expect(screen.getByTestId('codemirror-editor')).toBeInTheDocument();
    });
  });
});