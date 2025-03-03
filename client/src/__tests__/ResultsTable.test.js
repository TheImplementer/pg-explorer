import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResultsTable from '../components/ResultsTable';

// Mock the clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('ResultsTable Component', () => {
  // Mock data for testing
  const mockResults = {
    success: true,
    rows: [
      { id: 1, name: 'John', email: 'john@example.com' },
      { id: 2, name: 'Jane', email: 'jane@example.com' },
      { id: 3, name: 'Bob', email: 'bob@example.com' },
    ],
    fields: [
      { name: 'id' },
      { name: 'name' },
      { name: 'email' },
    ],
    rowCount: 3
  };
  
  const mockSetPage = jest.fn();
  const mockSetRowsPerPage = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders table with results data', () => {
    render(
      <ResultsTable 
        results={mockResults} 
        page={0} 
        setPage={mockSetPage} 
        rowsPerPage={10} 
        setRowsPerPage={mockSetRowsPerPage} 
      />
    );
    
    // Check table header
    expect(screen.getByText('Query Results')).toBeInTheDocument();
    expect(screen.getByText('3 rows returned')).toBeInTheDocument();
    
    // Check column headers
    expect(screen.getByText('#')).toBeInTheDocument(); // Row number column
    expect(screen.getByText('id')).toBeInTheDocument();
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('email')).toBeInTheDocument();
    
    // Check row data
    expect(screen.getByText('1')).toBeInTheDocument(); // First row
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    
    expect(screen.getByText('2')).toBeInTheDocument(); // Second row
    expect(screen.getByText('Jane')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });
  
  test('pagination controls are working', () => {
    // Create more results for pagination
    const manyRows = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`
    }));
    
    const paginatedResults = {
      ...mockResults,
      rows: manyRows,
      rowCount: 25
    };
    
    render(
      <ResultsTable 
        results={paginatedResults} 
        page={0} 
        setPage={mockSetPage} 
        rowsPerPage={10} 
        setRowsPerPage={mockSetRowsPerPage} 
      />
    );
    
    // Check pagination info
    expect(screen.getByText('25 rows returned')).toBeInTheDocument();
    expect(screen.getByText('1–10 of 25')).toBeInTheDocument();
    
    // Navigate to next page
    const nextPageButton = screen.getByRole('button', { name: /next page/i });
    fireEvent.click(nextPageButton);
    expect(mockSetPage).toHaveBeenCalledWith(1);
    
    // Change rows per page
    const rowsPerPageSelect = screen.getByRole('combobox');
    fireEvent.mouseDown(rowsPerPageSelect);
    const options = screen.getAllByRole('option');
    fireEvent.click(options[1]); // Select 25 per page
    expect(mockSetRowsPerPage).toHaveBeenCalled();
  });
  
  test('export to CSV functionality works', () => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => 'mock-csv-url');
    global.URL.revokeObjectURL = jest.fn();
    
    // Create a spy for document.createElement to check if we're creating a link
    const originalCreateElement = document.createElement;
    const mockAnchor = {
      href: '',
      download: '',
      click: jest.fn(),
      style: {}
    };
    document.createElement = jest.fn((tag) => {
      if (tag === 'a') return mockAnchor;
      return originalCreateElement(tag);
    });
    
    render(
      <ResultsTable 
        results={mockResults} 
        page={0} 
        setPage={mockSetPage} 
        rowsPerPage={10} 
        setRowsPerPage={mockSetRowsPerPage} 
      />
    );
    
    // Click export button
    const exportButton = screen.getByRole('button', { name: /Export CSV/i });
    fireEvent.click(exportButton);
    
    // Check if CSV export was triggered
    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(mockAnchor.download).toBeTruthy();
    expect(mockAnchor.click).toHaveBeenCalled();
    
    // Restore original function
    document.createElement = originalCreateElement;
  });
  
  test('copy to clipboard functionality works', () => {
    render(
      <ResultsTable 
        results={mockResults} 
        page={0} 
        setPage={mockSetPage} 
        rowsPerPage={10} 
        setRowsPerPage={mockSetRowsPerPage} 
      />
    );
    
    // Click copy button
    const copyButton = screen.getByRole('button', { name: /Copy to clipboard/i });
    fireEvent.click(copyButton);
    
    // Check if clipboard API was called
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    const clipboardText = navigator.clipboard.writeText.mock.calls[0][0];
    
    // Verify clipboard content format (should be CSV-like)
    expect(clipboardText).toContain('id,name,email');
    expect(clipboardText).toContain('1,John,john@example.com');
  });
  
  test('search filter functionality works', () => {
    render(
      <ResultsTable 
        results={mockResults} 
        page={0} 
        setPage={mockSetPage} 
        rowsPerPage={10} 
        setRowsPerPage={mockSetRowsPerPage} 
      />
    );
    
    const searchInput = screen.getByPlaceholderText(/Search results/i);
    
    // Initially all rows are visible
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    
    // Search for 'John'
    userEvent.type(searchInput, 'John');
    
    // Only John should be visible, Jane and Bob filtered out
    const tableBody = screen.getByRole('rowgroup', { name: '' });
    const rows = within(tableBody).getAllByRole('row');
    expect(rows.length).toBe(1);
    expect(within(rows[0]).getByText('John')).toBeInTheDocument();
    expect(screen.queryByText('Jane')).not.toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });
  
  test('handles empty results gracefully', () => {
    const emptyResults = {
      success: true,
      rows: [],
      fields: [],
      rowCount: 0
    };
    
    render(
      <ResultsTable 
        results={emptyResults} 
        page={0} 
        setPage={mockSetPage} 
        rowsPerPage={10} 
        setRowsPerPage={mockSetRowsPerPage} 
      />
    );
    
    // Check empty state messaging
    expect(screen.getByText('0 rows returned')).toBeInTheDocument();
    expect(screen.getByText('No data to display')).toBeInTheDocument();
  });
});