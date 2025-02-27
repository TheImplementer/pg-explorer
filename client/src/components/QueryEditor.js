import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper,
  Alert,
  Collapse,
  IconButton
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

const QueryEditor = ({ onResults, selectedTable }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // When a table is selected, generate a SELECT query
  useEffect(() => {
    if (selectedTable) {
      setQuery(`SELECT * FROM "${selectedTable.schema}"."${selectedTable.table}" LIMIT 100;`);
    }
  }, [selectedTable]);

  const handleExecuteQuery = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/query', { query });
      onResults(response.data);
    } catch (err) {
      console.error('Query error:', err);
      setError(err.response?.data?.message || 'Error executing query');
      onResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2 
        }}
      >
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<PlayArrowIcon />}
          onClick={handleExecuteQuery}
          disabled={loading || !query.trim()}
          size="small"
        >
          {loading ? 'Executing...' : 'Execute Query'}
        </Button>
      </Box>

      <Collapse in={!!error}>
        <Alert 
          severity="error"
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setError('')}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      </Collapse>

      <TextField
        multiline
        fullWidth
        variant="outlined"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter SQL query here..."
        sx={{ 
          flexGrow: 1,
          '& .MuiInputBase-root': { 
            height: '100%',
            display: 'flex',
            '& textarea': {
              flex: 1,
              fontFamily: 'monospace',
              fontSize: '14px',
            }
          } 
        }}
      />
    </Box>
  );
};

export default QueryEditor;