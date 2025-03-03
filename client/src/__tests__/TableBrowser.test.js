import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import TableBrowser from '../components/TableBrowser';

// Mock axios
jest.mock('axios');

describe('TableBrowser Component', () => {
  const mockOnSelectTable = jest.fn();
  
  // Mock API response for tables
  const mockTablesResponse = {
    success: true,
    tables: [
      { table_schema: 'public', table_name: 'users' },
      { table_schema: 'public', table_name: 'orders' },
      { table_schema: 'auth', table_name: 'users' },
      { table_schema: 'auth', table_name: 'permissions' }
    ]
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API response
    axios.get.mockResolvedValue({ data: mockTablesResponse });
  });
  
  test('renders loading state initially', () => {
    render(<TableBrowser onSelectTable={mockOnSelectTable} />);
    
    // Initially should show loading indicator
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
  
  test('fetches and displays tables after loading', async () => {
    render(<TableBrowser onSelectTable={mockOnSelectTable} />);
    
    // Check if API was called
    expect(axios.get).toHaveBeenCalledWith('/api/tables');
    
    // Wait for tables to load
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Verify schemas are displayed
    expect(screen.getByText('public')).toBeInTheDocument();
    expect(screen.getByText('auth')).toBeInTheDocument();
  });
  
  test('expands schema to show tables', async () => {
    render(<TableBrowser onSelectTable={mockOnSelectTable} />);
    
    // Wait for tables to load
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Initially tables should not be visible
    expect(screen.queryByText('users (public)')).not.toBeInTheDocument();
    
    // Click on a schema to expand it
    fireEvent.click(screen.getByText('public'));
    
    // Now tables should be visible
    expect(screen.getByText('users')).toBeInTheDocument();
    expect(screen.getByText('orders')).toBeInTheDocument();
  });
  
  test('selects a table when clicked', async () => {
    render(<TableBrowser onSelectTable={mockOnSelectTable} />);
    
    // Wait for tables to load
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Expand schema
    fireEvent.click(screen.getByText('public'));
    
    // Click on a table
    fireEvent.click(screen.getByText('users'));
    
    // Check if onSelectTable was called with correct params
    expect(mockOnSelectTable).toHaveBeenCalledWith('public', 'users');
  });
  
  test('filters tables with search', async () => {
    render(<TableBrowser onSelectTable={mockOnSelectTable} />);
    
    // Wait for tables to load
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Find search input
    const searchInput = screen.getByPlaceholderText(/Search tables/i);
    
    // Enter search term to filter tables with "orders"
    userEvent.type(searchInput, 'orders');
    
    // Schemas should be auto-expanded when filtering
    await waitFor(() => {
      // 'orders' table should be visible but 'users' should not
      expect(screen.getByText('orders')).toBeInTheDocument();
      expect(screen.queryByText('users')).not.toBeInTheDocument();
    });
  });
  
  test('displays error message when API fails', async () => {
    // Force API to fail for this test
    axios.get.mockRejectedValueOnce(new Error('Failed to fetch tables'));
    
    render(<TableBrowser onSelectTable={mockOnSelectTable} />);
    
    // Wait for error to show
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch tables/i)).toBeInTheDocument();
    });
  });
  
  test('switches between table view and schema view', async () => {
    render(<TableBrowser onSelectTable={mockOnSelectTable} />);
    
    // Wait for tables to load
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Initial view should be "Tables" (tab 0)
    expect(screen.getByRole('tab', { selected: true }).textContent).toBe('Tables');
    
    // Switch to "Schemas" view
    const schemasTab = screen.getByRole('tab', { name: /Schemas/i });
    fireEvent.click(schemasTab);
    
    // Now "Schemas" should be selected
    expect(screen.getByRole('tab', { selected: true }).textContent).toBe('Schemas');
  });
  
  test('handles empty tables response gracefully', async () => {
    // Mock empty tables response
    axios.get.mockResolvedValueOnce({ data: { success: true, tables: [] } });
    
    render(<TableBrowser onSelectTable={mockOnSelectTable} />);
    
    // Wait for tables to load
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Should show "No tables found" message
    expect(screen.getByText(/No tables found/i)).toBeInTheDocument();
  });
});