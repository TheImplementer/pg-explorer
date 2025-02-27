import React, { useState, useEffect, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  IconButton,
  Tooltip
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ConnectionForm from './components/ConnectionForm';
import QueryEditor from './components/QueryEditor';
import ResultsTable from './components/ResultsTable';
import TableBrowser from './components/TableBrowser';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [queryResults, setQueryResults] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTable, setSelectedTable] = useState(null);
  
  // Theme mode state with localStorage persistence
  const [mode, setMode] = useState(() => {
    // Initialize theme from localStorage or default to 'dark'
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'dark';
  });
  
  // Create theme based on current mode
  const theme = useMemo(() => 
    createTheme({
      palette: {
        mode,
        primary: {
          main: mode === 'dark' ? '#90caf9' : '#1976d2',
        },
        secondary: {
          main: mode === 'dark' ? '#f48fb1' : '#dc004e',
        },
        background: {
          default: mode === 'dark' ? '#121212' : '#f5f5f5',
          paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
        },
      },
    }), [mode]
  );
  
  // Toggle between light and dark mode
  const toggleColorMode = () => {
    const newMode = mode === 'dark' ? 'light' : 'dark';
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };
  
  // Pagination state lifted to App component
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Reset pagination when a new query is run
  useEffect(() => {
    if (queryResults) {
      setPage(0);
    }
  }, [queryResults]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleTableSelect = (schema, table) => {
    setSelectedTable({ schema, table });
    // Automatically build a SELECT query for the table
    setActiveTab(0); // Switch to query tab
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ height: '100vh', py: 2 }}>
        <Box sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          position: 'relative' 
        }}>
          {/* Theme toggle button - always visible */}
          <Box 
            sx={{ 
              position: 'absolute',
              top: 0,
              right: 0,
              zIndex: 1100
            }}
          >
            <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
              <IconButton 
                onClick={toggleColorMode} 
                color="inherit" 
                aria-label="toggle theme"
                sx={{ m: 1 }}
              >
                {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
          </Box>
          
          {!isConnected ? (
            <ConnectionForm onConnect={() => setIsConnected(true)} />
          ) : (
            <Box sx={{ display: 'flex', height: '100%', gap: 2 }}>
              {/* Left sidebar - Table Browser */}
              <Paper 
                sx={{ 
                  width: '280px', 
                  display: 'flex', 
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}
              >
                <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  Database Explorer
                </Typography>
                <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                  <TableBrowser onSelectTable={handleTableSelect} />
                </Box>
              </Paper>
              
              {/* Right main content - Query Editor and Results */}
              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Paper 
                  sx={{ 
                    mb: 2, 
                    display: 'flex', 
                    flexDirection: 'column',
                    height: queryResults ? '50%' : '100%',
                    overflow: 'hidden'
                  }}
                >
                  <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    SQL Query
                  </Typography>
                  <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                    <QueryEditor onResults={setQueryResults} selectedTable={selectedTable} />
                  </Box>
                </Paper>
                
                {queryResults && (
                  <Paper 
                    sx={{ 
                      flexGrow: 1, 
                      display: 'flex', 
                      flexDirection: 'column',
                      overflow: 'hidden'
                    }}
                  >
                    <ResultsTable 
                      results={queryResults}
                      page={page}
                      setPage={setPage}
                      rowsPerPage={rowsPerPage}
                      setRowsPerPage={setRowsPerPage}
                    />
                  </Paper>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;