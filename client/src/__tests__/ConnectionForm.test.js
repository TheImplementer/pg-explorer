import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import ConnectionForm from '../components/ConnectionForm';

// Mock axios
jest.mock('axios');

describe('ConnectionForm Component', () => {
  const mockOnConnect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the connection form with all fields', () => {
    render(<ConnectionForm onConnect={mockOnConnect} />);
    
    // Check for form title
    expect(screen.getByText(/Connect to PostgreSQL Database/i)).toBeInTheDocument();
    
    // Check for standard database connection fields
    expect(screen.getByLabelText(/Host/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Port/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Database/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    
    // Check for IAM toggle
    expect(screen.getByLabelText(/Use AWS IAM Authentication/i)).toBeInTheDocument();
    
    // Check for connect button
    expect(screen.getByRole('button', { name: /Connect/i })).toBeInTheDocument();
  });

  test('has correct default values', () => {
    render(<ConnectionForm onConnect={mockOnConnect} />);
    
    expect(screen.getByLabelText(/Host/i)).toHaveValue('localhost');
    expect(screen.getByLabelText(/Port/i)).toHaveValue('5432');
    expect(screen.getByLabelText(/Database/i)).toHaveValue('');
    expect(screen.getByLabelText(/Username/i)).toHaveValue('');
    expect(screen.getByLabelText(/Password/i)).toHaveValue('');
  });

  test('updates form fields when user types', () => {
    render(<ConnectionForm onConnect={mockOnConnect} />);
    
    // Simulate user typing in each field
    userEvent.type(screen.getByLabelText(/Host/i), 'testserver');
    userEvent.clear(screen.getByLabelText(/Port/i));
    userEvent.type(screen.getByLabelText(/Port/i), '5433');
    userEvent.type(screen.getByLabelText(/Database/i), 'testdb');
    userEvent.type(screen.getByLabelText(/Username/i), 'testuser');
    userEvent.type(screen.getByLabelText(/Password/i), 'password');
    
    // Check if values were updated
    expect(screen.getByLabelText(/Host/i)).toHaveValue('localhosttestserver');
    expect(screen.getByLabelText(/Port/i)).toHaveValue('5433');
    expect(screen.getByLabelText(/Database/i)).toHaveValue('testdb');
    expect(screen.getByLabelText(/Username/i)).toHaveValue('testuser');
    expect(screen.getByLabelText(/Password/i)).toHaveValue('password');
  });

  test('toggles between password and IAM authentication', () => {
    render(<ConnectionForm onConnect={mockOnConnect} />);
    
    // Initially, password field should be visible and region field should not
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/AWS Region/i)).not.toBeInTheDocument();
    
    // Toggle IAM authentication on
    const iamToggle = screen.getByLabelText(/Use AWS IAM Authentication/i);
    fireEvent.click(iamToggle);
    
    // Now region field should be visible and password field should not
    expect(screen.queryByLabelText(/Password/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/AWS Region/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/AWS Region/i)).toHaveValue('us-east-1');
    
    // Toggle IAM authentication off
    fireEvent.click(iamToggle);
    
    // Password field should be visible again and region field should not
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/AWS Region/i)).not.toBeInTheDocument();
  });

  test('calls API with correct data on form submission for password auth', async () => {
    // Mock successful API response
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    
    render(<ConnectionForm onConnect={mockOnConnect} />);
    
    // Fill in the form
    userEvent.type(screen.getByLabelText(/Database/i), 'testdb');
    userEvent.type(screen.getByLabelText(/Username/i), 'testuser');
    userEvent.type(screen.getByLabelText(/Password/i), 'password');
    
    // Submit the form
    const connectButton = screen.getByRole('button', { name: /Connect/i });
    fireEvent.click(connectButton);
    
    // Check if API was called with correct parameters
    expect(axios.post).toHaveBeenCalledWith('/api/connect', expect.objectContaining({
      host: 'localhost',
      port: '5432',
      database: 'testdb',
      user: 'testuser',
      password: 'password',
      useIam: false
    }));
    
    // Wait for the onConnect callback to be called
    await waitFor(() => {
      expect(mockOnConnect).toHaveBeenCalled();
    });
  });

  test('calls API with correct data on form submission for IAM auth', async () => {
    // Mock successful API response
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    
    render(<ConnectionForm onConnect={mockOnConnect} />);
    
    // Toggle IAM authentication on
    const iamToggle = screen.getByLabelText(/Use AWS IAM Authentication/i);
    fireEvent.click(iamToggle);
    
    // Fill in the form
    userEvent.type(screen.getByLabelText(/Database/i), 'testdb');
    userEvent.type(screen.getByLabelText(/Username/i), 'testuser');
    userEvent.clear(screen.getByLabelText(/AWS Region/i));
    userEvent.type(screen.getByLabelText(/AWS Region/i), 'us-west-2');
    
    // Submit the form
    const connectButton = screen.getByRole('button', { name: /Connect/i });
    fireEvent.click(connectButton);
    
    // Check if API was called with correct parameters
    expect(axios.post).toHaveBeenCalledWith('/api/connect', expect.objectContaining({
      host: 'localhost',
      port: '5432',
      database: 'testdb',
      user: 'testuser',
      region: 'us-west-2',
      useIam: true
    }));
    
    // Wait for the onConnect callback to be called
    await waitFor(() => {
      expect(mockOnConnect).toHaveBeenCalled();
    });
  });

  test('displays error message when connection fails', async () => {
    // Mock failed API response
    const errorMessage = 'Invalid credentials';
    axios.post.mockRejectedValueOnce({ 
      response: { data: { message: errorMessage } } 
    });
    
    render(<ConnectionForm onConnect={mockOnConnect} />);
    
    // Fill in the form
    userEvent.type(screen.getByLabelText(/Database/i), 'testdb');
    userEvent.type(screen.getByLabelText(/Username/i), 'testuser');
    
    // Submit the form
    const connectButton = screen.getByRole('button', { name: /Connect/i });
    fireEvent.click(connectButton);
    
    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    
    // Verify onConnect was not called
    expect(mockOnConnect).not.toHaveBeenCalled();
  });

  test('disables connect button while loading', async () => {
    // Create a promise that we won't resolve immediately to keep loading state active
    let resolvePromise;
    const mockPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    axios.post.mockImplementationOnce(() => mockPromise);
    
    render(<ConnectionForm onConnect={mockOnConnect} />);
    
    // Fill in the form
    userEvent.type(screen.getByLabelText(/Database/i), 'testdb');
    userEvent.type(screen.getByLabelText(/Username/i), 'testuser');
    
    // Submit the form
    const connectButton = screen.getByRole('button', { name: /Connect/i });
    fireEvent.click(connectButton);
    
    // Button should now be in loading state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Connecting/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Connecting/i })).toBeDisabled();
    });
    
    // Resolve the promise to complete the test
    resolvePromise({ data: { success: true } });
  });
});