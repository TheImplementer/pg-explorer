import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Button, 
  Alert,
  Collapse,
  IconButton,
  useTheme,
  Tooltip,
  CircularProgress
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloseIcon from '@mui/icons-material/Close';
import SchemaIcon from '@mui/icons-material/AccountTree';
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

// SQL functions for autocomplete
const sqlFunctions = [
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COALESCE', 'NULLIF', 'CURRENT_DATE',
  'CURRENT_TIME', 'CURRENT_TIMESTAMP', 'EXTRACT', 'TO_CHAR', 'TO_DATE',
  'LENGTH', 'LOWER', 'UPPER', 'SUBSTRING', 'TRIM', 'CONCAT', 'ROUND', 'TRUNC',
  'CAST', 'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'NTILE', 'LAG', 'LEAD', 'FIRST_VALUE',
  'LAST_VALUE', 'PERCENTILE_CONT', 'PERCENTILE_DISC', 'ARRAY_AGG', 'STRING_AGG',
  'JSON_AGG', 'JSONB_AGG', 'JSONB_OBJECT_AGG', 'REGEXP_MATCH', 'REGEXP_REPLACE'
];

const QueryEditor = ({ onResults, selectedTable }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tableColumns, setTableColumns] = useState([]);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [schemaInfo, setSchemaInfo] = useState(null);
  const theme = useTheme();

  // Fetch database schema information when connected
  useEffect(() => {
    const fetchSchemaInfo = async () => {
      setLoadingSchema(true);
      try {
        const response = await axios.get('/api/schema-info');
        if (response.data.success) {
          setSchemaInfo(response.data.schemaInfo);
        }
      } catch (err) {
        console.error('Error fetching schema info:', err);
      } finally {
        setLoadingSchema(false);
      }
    };

    fetchSchemaInfo();
  }, []);

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

  // Enhanced SQL completion function for CodeMirror
  const myCompletions = useCallback(context => {
    // Get the current text and position
    const { state, pos } = context;
    const line = state.doc.lineAt(pos);
    const lineText = line.text.substring(0, pos - line.from);
    
    // Try to match different patterns based on context
    
    // Case 1: After 'FROM' or 'JOIN' - suggest schema or table names
    const tableContext = lineText.match(/\b(FROM|JOIN)\s+([^,\s]*)$/i);
    if (tableContext && schemaInfo) {
      const prefix = tableContext[2] || '';
      const dotIndex = prefix.indexOf('.');
      
      // If there's a dot, suggest specific schema tables
      if (dotIndex !== -1) {
        const schema = prefix.substring(0, dotIndex);
        const tablePrefix = prefix.substring(dotIndex + 1);
        
        // Find tables in the specified schema
        const matchingTables = Object.keys(schemaInfo.tables)
          .filter(key => key.startsWith(`${schema}.`))
          .map(key => {
            const table = schemaInfo.tables[key].name;
            return { 
              label: table, 
              type: 'class',
              info: `Table in ${schema} schema`,
              apply: `"${schema}"."${table}"`
            };
          })
          .filter(item => item.label.toLowerCase().startsWith(tablePrefix.toLowerCase()));
        
        return {
          from: pos - tablePrefix.length,
          options: matchingTables,
          span: /^[a-zA-Z0-9_]+$/
        };
      }
      
      // If no dot, suggest schemas and full table names
      const options = [
        // Schema suggestions
        ...schemaInfo.schemas.map(schema => ({
          label: schema,
          type: 'namespace',
          info: 'Schema',
          apply: `${schema}.`,
          boost: 10
        })),
        // Full table name suggestions
        ...Object.keys(schemaInfo.tables).map(key => {
          const parts = key.split('.');
          return {
            label: `${parts[0]}.${parts[1]}`,
            type: 'class',
            info: `Table in ${parts[0]} schema`,
            apply: `"${parts[0]}"."${parts[1]}"`
          };
        })
      ].filter(item => 
        item.label.toLowerCase().startsWith(prefix.toLowerCase()) ||
        item.label.toLowerCase().includes(prefix.toLowerCase())
      );
      
      return {
        from: pos - prefix.length,
        options,
        span: /^[a-zA-Z0-9_.]+$/
      };
    }
    
    // Case 2: After dot in a qualified name - suggest columns
    const columnContext = lineText.match(/([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]*)$/);
    if (columnContext && schemaInfo) {
      const schema = columnContext[1];
      const table = columnContext[2];
      const columnPrefix = columnContext[3] || '';
      const schemaTable = `${schema}.${table}`;
      
      // Find columns for the specified table
      if (schemaInfo.columns[schemaTable]) {
        const matchingColumns = schemaInfo.columns[schemaTable]
          .map(col => ({
            label: col.name,
            type: 'property',
            info: `${col.type}`,
            apply: `"${col.name}"`
          }))
          .filter(item => item.label.toLowerCase().startsWith(columnPrefix.toLowerCase()));
        
        return {
          from: pos - columnPrefix.length,
          options: matchingColumns,
          span: /^[a-zA-Z0-9_]+$/
        };
      }
    }
    
    // Case 3: Simple column name or general completion
    const word = context.matchBefore(/\w*/);
    if (!word || word.from === word.to) {
      return null;
    }
    
    // Build the completions array
    let completions = [
      // SQL keywords
      ...sqlKeywords.map(keyword => ({ 
        label: keyword, 
        type: 'keyword',
        boost: 5
      })),
      // SQL functions
      ...sqlFunctions.map(func => ({ 
        label: func, 
        type: 'function',
        boost: 3
      }))
    ];
    
    // Add schema-aware completions if available
    if (schemaInfo) {
      // Add schemas
      completions.push(
        ...schemaInfo.schemas.map(schema => ({
          label: schema,
          type: 'namespace',
          info: 'Schema'
        }))
      );
      
      // Add table names
      completions.push(
        ...Object.values(schemaInfo.tables).map(table => ({
          label: table.name,
          type: 'class',
          info: `Table in ${table.schema} schema`
        }))
      );
      
      // Add columns from the currently selected table
      if (selectedTable) {
        const schemaTable = `${selectedTable.schema}.${selectedTable.table}`;
        if (schemaInfo.columns[schemaTable]) {
          completions.push(
            ...schemaInfo.columns[schemaTable].map(col => ({
              label: col.name,
              type: 'property',
              info: `${col.type} - ${selectedTable.table}`
            }))
          );
        }
      }
    }
    
    // Also add columns from the current table
    completions.push(
      ...tableColumns.map(column => ({ 
        label: column, 
        type: 'variable',
        boost: 4
      }))
    );
    
    return {
      from: word.from,
      options: completions.filter(item => 
        item.label.toLowerCase().startsWith(word.text.toLowerCase())
      ),
      span: /^[a-zA-Z0-9_]+$/
    };
  }, [tableColumns, schemaInfo, selectedTable]);

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
          
          <Tooltip title="Database schema loaded for autocompletion">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <SchemaIcon 
                color={schemaInfo ? 'success' : 'disabled'} 
                fontSize="small" 
              />
              {loadingSchema && <CircularProgress size={16} />}
            </Box>
          </Tooltip>
        </Box>
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
            autocompletion({ override: [myCompletions], maxRenderedOptions: 15 })
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