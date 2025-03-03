import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Button, 
  Alert,
  Collapse,
  IconButton,
  useTheme
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { autocompletion } from '@codemirror/autocomplete';
import { oneDark } from '@codemirror/theme-one-dark';

// SQL keywords for autocomplete suggestions
const sqlKeywords = [
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 
  'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'ALL',
  'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'TABLE', 'VIEW',
  'INDEX', 'CONSTRAINT', 'CASCADE', 'REFERENCES', 'FOREIGN KEY', 'PRIMARY KEY',
  'UNIQUE', 'NOT NULL', 'DEFAULT', 'AS', 'DISTINCT', 'COUNT', 'SUM', 'AVG',
  'MIN', 'MAX', 'AND', 'OR', 'IN', 'BETWEEN', 'LIKE', 'IS NULL', 'IS NOT NULL',
  'ASC', 'DESC', 'WITH', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'OVER', 'PARTITION BY'
];

const QueryEditor = ({ onResults, selectedTable }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tableColumns, setTableColumns] = useState([]);
  const theme = useTheme();

  // When a table is selected, generate a SELECT query and fetch its columns
  useEffect(() => {
    if (selectedTable) {
      setQuery(`SELECT * FROM "${selectedTable.schema}"."${selectedTable.table}" LIMIT 100;`);
      
      // Fetch table columns for autocomplete
      const fetchColumns = async () => {
        try {
          const response = await axios.get(
            `/api/columns/${selectedTable.schema}/${selectedTable.table}`
          );
          if (response.data.success) {
            setTableColumns(response.data.columns.map(col => col.column_name));
          }
        } catch (err) {
          console.error('Error fetching columns:', err);
        }
      };
      
      fetchColumns();
    }
  }, [selectedTable]);

  // SQL completion function for CodeMirror
  const myCompletions = useCallback(context => {
    let word = context.matchBefore(/\w*/);
    if (!word || word.from === word.to) {
      return null;
    }

    // Create completions array from keywords and table columns
    const completions = [
      ...sqlKeywords.map(keyword => ({ label: keyword, type: 'keyword' })),
      ...tableColumns.map(column => ({ label: column, type: 'variable' }))
    ];

    return {
      from: word.from,
      options: completions.filter(item => 
        item.label.toLowerCase().startsWith(word.text.toLowerCase())
      )
    };
  }, [tableColumns]);

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

  // Execute query on Ctrl+Enter
  const handleKeyDown = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      handleExecuteQuery();
    }
  };

  // Choose theme based on app theme mode
  const editorTheme = theme.palette.mode === 'dark' ? oneDark : [];

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        p: 2 
      }} 
      onKeyDown={handleKeyDown}
    >
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
        <Box sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
          Press Ctrl+Enter to run query
        </Box>
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

      <Box sx={{ flexGrow: 1, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
        <CodeMirror
          value={query}
          height="100%"
          onChange={(value) => setQuery(value)}
          extensions={[
            sql(), 
            autocompletion({ override: [myCompletions] })
          ]}
          theme={editorTheme}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            foldGutter: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            defaultKeymap: true,
            searchKeymap: true,
            historyKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
          placeholder="Enter SQL query here..."
        />
      </Box>
    </Box>
  );
};

export default QueryEditor;