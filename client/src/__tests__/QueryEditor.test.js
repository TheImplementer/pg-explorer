import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import QueryEditor from '../components/QueryEditor';

// Mock axios
jest.mock('axios');

describe('QueryEditor Component', () => {
  const mockOnResults = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders query editor with execute button', () => {
    render(<QueryEditor onResults={mockOnResults} />);
    
    // Check for main elements
    expect(screen.getByText(/Execute Query/i)).toBeInTheDocument();
    expect(screen.getByText(/Press Ctrl\+Enter to run query/i)).toBeInTheDocument();
    expect(screen.getByTestId('codemirror-editor')).toBeInTheDocument();
  });
  
  test('execute button is disabled when query is empty', () => {
    render(<QueryEditor onResults={mockOnResults} />);
    
    const executeButton = screen.getByText(/Execute Query/i).closest('button');
    expect(executeButton).toBeDisabled();
  });
  
  test('sets query when a table is selected', () => {
    const selectedTable = { schema: 'public', table: 'users' };
    render(<QueryEditor onResults={mockOnResults} selectedTable={selectedTable} />);
    
    // Check if the query is set with the selected table
    const textArea = screen.getByTestId('codemirror-textarea');
    expect(textArea).toHaveValue('SELECT * FROM "public"."users" LIMIT 100;');
  });
  
  test('fetches table columns when a table is selected', async () => {
    // Mock successful API response with columns
    const columns = [
      { column_name: 'id' },
      { column_name: 'name' },
      { column_name: 'email' }
    ];
    axios.get.mockResolvedValueOnce({ data: { success: true, columns } });
    
    const selectedTable = { schema: 'public', table: 'users' };
    render(<QueryEditor onResults={mockOnResults} selectedTable={selectedTable} />);
    
    // Verify API call to fetch columns
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/columns/public/users');
    });
  });
  
  test('executes query when button is clicked', async () => {
    // Mock successful API response
    const mockResults = { 
      success: true, 
      rows: [{ id: 1, name: 'Test' }], 
      rowCount: 1, 
      fields: [{ name: 'id' }, { name: 'name' }] 
    };
    axios.post.mockResolvedValueOnce({ data: mockResults });
    
    render(<QueryEditor onResults={mockOnResults} />);
    
    // Set a query
    const textArea = screen.getByTestId('codemirror-textarea');
    fireEvent.change(textArea, { target: { value: 'SELECT * FROM users;' } });
    
    // Click execute button
    const executeButton = screen.getByText(/Execute Query/i).closest('button');
    fireEvent.click(executeButton);
    
    // Verify API call
    expect(axios.post).toHaveBeenCalledWith('/api/query', { query: 'SELECT * FROM users;' });
    
    // Verify results callback
    await waitFor(() => {
      expect(mockOnResults).toHaveBeenCalledWith(mockResults);
    });
  });
  
  test('displays error message when query execution fails', async () => {
    // Mock failed API response
    const errorMessage = 'Syntax error in SQL statement';
    axios.post.mockRejectedValueOnce({ 
      response: { data: { message: errorMessage } } 
    });
    
    render(<QueryEditor onResults={mockOnResults} />);
    
    // Set a query
    const textArea = screen.getByTestId('codemirror-textarea');
    fireEvent.change(textArea, { target: { value: 'SELECT * FROM;' } });
    
    // Click execute button
    const executeButton = screen.getByText(/Execute Query/i).closest('button');
    fireEvent.click(executeButton);
    
    // Verify error message
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    
    // Verify onResults called with null
    expect(mockOnResults).toHaveBeenCalledWith(null);
  });
  
  test('shows loading state during query execution', async () => {
    // Create a promise that we won't resolve immediately to keep loading state active
    let resolvePromise;
    const mockPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    axios.post.mockImplementationOnce(() => mockPromise);
    
    render(<QueryEditor onResults={mockOnResults} />);
    
    // Set a query
    const textArea = screen.getByTestId('codemirror-textarea');
    fireEvent.change(textArea, { target: { value: 'SELECT * FROM users;' } });
    
    // Click execute button
    const executeButton = screen.getByText(/Execute Query/i).closest('button');
    fireEvent.click(executeButton);
    
    // Verify loading state
    await waitFor(() => {
      expect(screen.getByText(/Executing/i)).toBeInTheDocument();
      const loadingButton = screen.getByText(/Executing/i).closest('button');
      expect(loadingButton).toBeDisabled();
    });
    
    // Resolve the promise to complete the test
    resolvePromise({ data: { success: true, rows: [] } });
  });
  
  test('can close error message', async () => {
    // Mock failed API response
    axios.post.mockRejectedValueOnce({ 
      response: { data: { message: 'Error' } } 
    });
    
    render(<QueryEditor onResults={mockOnResults} />);
    
    // Set a query and execute
    const textArea = screen.getByTestId('codemirror-textarea');
    fireEvent.change(textArea, { target: { value: 'SELECT * FROM users;' } });
    const executeButton = screen.getByText(/Execute Query/i).closest('button');
    fireEvent.click(executeButton);
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
    
    // Click close button
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    // Verify error message is gone
    expect(screen.queryByText('Error')).not.toBeInTheDocument();
  });
});