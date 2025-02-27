import React, { useState, useEffect } from 'react';
import {
  Typography, 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Button,
  TextField,
  InputAdornment,
  Badge,
  Chip
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';

// Custom pagination actions component with memoization
const TablePaginationActions = React.memo((props) => {
  const { count, page, rowsPerPage, onPageChange } = props;
  
  const lastPage = Math.max(0, Math.ceil(count / rowsPerPage) - 1);

  const handleFirstPageButtonClick = (event) => {
    onPageChange(event, 0);
  };

  const handleBackButtonClick = (event) => {
    onPageChange(event, Math.max(0, page - 1));
  };

  const handleNextButtonClick = (event) => {
    onPageChange(event, Math.min(lastPage, page + 1));
  };

  const handleLastPageButtonClick = (event) => {
    onPageChange(event, lastPage);
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 2.5 }}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="first page"
      >
        <FirstPageIcon />
      </IconButton>
      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="previous page"
      >
        <KeyboardArrowLeft />
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
      >
        <KeyboardArrowRight />
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
      >
        <LastPageIcon />
      </IconButton>
    </Box>
  );
});

const ResultsTable = ({ 
  results, 
  page, 
  setPage, 
  rowsPerPage, 
  setRowsPerPage 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRows, setFilteredRows] = useState(() => {
    return results && results.success ? results.rows : [];
  });

  if (!results || !results.success) {
    return null;
  }

  const { rows, rowCount, fields } = results;
  
  // Get column names from the fields
  const columns = fields.map(field => field.name);

  // Effect to update filtered rows when search term or rows change
  useEffect(() => {
    const filterData = () => {
      if (!searchTerm) return rows;
      
      return rows.filter(row => {
        return columns.some(column => {
          const value = row[column];
          if (value === null) return false;
          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        });
      });
    };
    
    setFilteredRows(filterData());
    
    // Only reset page to 0 when search term changes, not when rows or columns change
    if (searchTerm) {
      setPage(0);
    }
  }, [searchTerm, rows, columns, setPage]);

  const handleChangePage = (event, newValue) => {
    setPage(newValue);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const exportToCsv = () => {
    const csvContent = [
      columns.join(','),
      ...rows.map(row => {
        return columns.map(col => {
          const value = row[col];
          // Handle value formatting for CSV
          if (value === null) return '';
          if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
          return value;
        }).join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'query_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = () => {
    const textContent = [
      columns.join('\t'),
      ...rows.map(row => {
        return columns.map(col => row[col] === null ? '' : String(row[col])).join('\t');
      })
    ].join('\n');

    navigator.clipboard.writeText(textContent)
      .catch(err => console.error('Failed to copy to clipboard:', err));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Box 
        sx={{ 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" component="div" sx={{ mr: 1 }}>
            Results
          </Typography> 
          <Chip 
            label={`${rowCount} rows`} 
            size="small" 
            color="primary" 
            variant="outlined"
            sx={{ mr: 1 }}
          />
          {searchTerm && (
            <Chip 
              label={`Filtered: ${filteredRows.length}`} 
              size="small" 
              color="secondary" 
              variant="outlined"
            />
          )}
        </Box>
        <Box>
          <Tooltip title="Copy to clipboard">
            <IconButton onClick={copyToClipboard} size="small" sx={{ mr: 1 }}>
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>
          <Button 
            startIcon={<FileDownloadIcon />} 
            variant="outlined" 
            size="small"
            onClick={exportToCsv}
          >
            Export CSV
          </Button>
        </Box>
      </Box>
      
      <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search results..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  aria-label="clear search"
                  onClick={() => setSearchTerm('')}
                  edge="end"
                  size="small"
                >
                  <Badge badgeContent={filteredRows.length} color="primary">
                    <FilterListIcon />
                  </Badge>
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <TableContainer sx={{ height: '100%' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell 
                  sx={{ 
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    backgroundColor: 'background.paper',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    width: '50px'
                  }}
                >
                  #
                </TableCell>
                {columns.map((column) => (
                  <TableCell 
                    key={column}
                    sx={{ 
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      backgroundColor: 'background.paper',
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }}
                  >
                    {column}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, rowIndex) => {
                  const actualRowIndex = page * rowsPerPage + rowIndex + 1;
                  
                  return (
                    <TableRow 
                      hover 
                      key={rowIndex}
                      sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}
                    >
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                        {actualRowIndex}
                      </TableCell>
                      {columns.map((column) => {
                        const value = row[column];
                        let displayValue = value;
                        
                        // Handle null values
                        if (value === null) {
                          displayValue = <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>NULL</Typography>;
                        } 
                        // Handle objects & arrays
                        else if (typeof value === 'object') {
                          displayValue = JSON.stringify(value);
                        }
                        
                        return (
                          <TableCell key={column}>
                            {displayValue}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Box sx={{ borderTop: 1, borderColor: 'divider', position: 'sticky', bottom: 0, bgcolor: 'background.paper', zIndex: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" p={1}>
          <Box display="flex" alignItems="center">
            <Button 
              disabled={page === 0} 
              onClick={() => setPage(0)}
              variant="outlined"
              size="small"
              sx={{ minWidth: '35px', p: '4px', m: '0 4px' }}
            >
              <FirstPageIcon fontSize="small" />
            </Button>
            <Button 
              disabled={page === 0} 
              onClick={() => setPage(prev => Math.max(0, prev - 1))}
              variant="outlined"
              size="small"
              sx={{ minWidth: '35px', p: '4px', m: '0 4px' }}
            >
              <KeyboardArrowLeft fontSize="small" />
            </Button>
            
            <Typography variant="body2" sx={{ mx: 2 }}>
              Page {page + 1} of {Math.max(1, Math.ceil(filteredRows.length / rowsPerPage))}
            </Typography>
            
            <Button 
              disabled={page >= Math.ceil(filteredRows.length / rowsPerPage) - 1} 
              onClick={() => setPage(prev => Math.min(Math.ceil(filteredRows.length / rowsPerPage) - 1, prev + 1))}
              variant="outlined"
              size="small"
              sx={{ minWidth: '35px', p: '4px', m: '0 4px' }}
            >
              <KeyboardArrowRight fontSize="small" />
            </Button>
            <Button 
              disabled={page >= Math.ceil(filteredRows.length / rowsPerPage) - 1} 
              onClick={() => setPage(Math.max(0, Math.ceil(filteredRows.length / rowsPerPage) - 1))}
              variant="outlined"
              size="small"
              sx={{ minWidth: '35px', p: '4px', m: '0 4px' }}
            >
              <LastPageIcon fontSize="small" />
            </Button>
          </Box>
          
          <Box display="flex" alignItems="center">
            <Typography variant="body2" sx={{ mr: 2 }}>
              Rows per page:
            </Typography>
            {[10, 25, 50, 100].map(value => (
              <Button
                key={value}
                onClick={() => { 
                  setRowsPerPage(value);
                  setPage(0);
                }}
                variant={rowsPerPage === value ? "contained" : "outlined"}
                size="small"
                sx={{ mx: 0.5 }}
              >
                {value}
              </Button>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default React.memo(ResultsTable);