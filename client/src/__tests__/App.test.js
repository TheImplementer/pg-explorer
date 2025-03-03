import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('App Component', () => {
    test('renders connection form when not connected', () => {
        render(<App />);
        expect(screen.getByText(/Database Explorer/i)).toBeInTheDocument();
    });

    test('theme toggle button is present', () => {
        render(<App />);
        const themeButton = screen.getByRole('button', { name: /toggle theme/i });
        expect(themeButton).toBeInTheDocument();
    });

    test('toggles theme when theme button is clicked', () => {
        render(<App />);
        const themeButton = screen.getByRole('button', { name: /toggle theme/i });
        const initialMode = localStorage.getItem('themeMode');
        
        fireEvent.click(themeButton);
        
        const newMode = localStorage.getItem('themeMode');
        expect(newMode).not.toBe(initialMode);
    });

    test('shows SQL query section after connection', () => {
  render(<App />);
        const connectionForm = screen.getByText(/Database Explorer/i);
        fireEvent.click(connectionForm);
        
        expect(screen.getByText(/SQL Query/i)).toBeInTheDocument();
    });
});