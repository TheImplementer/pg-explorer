import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemButton, 
  Collapse, 
  CircularProgress,
  Paper,
  Divider,
  Alert,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Chip
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import TableIcon from '@mui/icons-material/TableChart';
import SchemaIcon from '@mui/icons-material/AccountTree';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';

const TableBrowser = ({ onSelectTable }) => {
  const [schemas, setSchemas] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openSchemas, setOpenSchemas] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0); // 0 = Tables, 1 = Schemas

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/tables');
      
      if (response.data.success) {
        // Group tables by schema
        const schemaGroups = {};
        
        response.data.tables.forEach(table => {
          if (!schemaGroups[table.table_schema]) {
            schemaGroups[table.table_schema] = [];
          }
          schemaGroups[table.table_schema].push(table.table_name);
        });
        
        setSchemas(schemaGroups);
        
        // Open public schema by default if it exists
        if (schemaGroups.public) {
          setOpenSchemas({ public: true });
        }
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
      setError('Failed to fetch database tables');
    } finally {
      setLoading(false);
    }
  };

  const handleSchemaToggle = (schema) => {
    setOpenSchemas(prev => ({
      ...prev,
      [schema]: !prev[schema]
    }));
  };

  const handleTableClick = (schema, table) => {
    onSelectTable(schema, table);
  };

  // Filter schemas and tables based on search term
  const filteredSchemas = Object.keys(schemas).reduce((filtered, schema) => {
    const lowercaseSearch = searchTerm.toLowerCase();
    const schemaMatches = schema.toLowerCase().includes(lowercaseSearch);
    
    const filteredTables = schemas[schema].filter(table => 
      table.toLowerCase().includes(lowercaseSearch)
    );
    
    if (schemaMatches || filteredTables.length > 0) {
      filtered[schema] = filteredTables;
      
      // Auto-open schemas with matching tables when searching
      if (searchTerm && filteredTables.length > 0) {
        setOpenSchemas(prev => ({
          ...prev,
          [schema]: true
        }));
      }
    }
    
    return filtered;
  }, {});

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, pb: 0 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 1 }}
        />
        
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="fullWidth"
          size="small"
        >
          <Tab 
            icon={<TableIcon fontSize="small" />} 
            label="Tables" 
            id="tables-tab"
            aria-controls="tables-panel"
            sx={{ minHeight: '48px' }}
          />
          <Tab 
            icon={<SchemaIcon fontSize="small" />} 
            label="Schemas" 
            id="schemas-tab"
            aria-controls="schemas-panel"
            sx={{ minHeight: '48px' }}
          />
        </Tabs>
      </Box>
      
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <div
          role="tabpanel"
          hidden={tabValue !== 0}
          id="tables-panel"
          aria-labelledby="tables-tab"
          style={{ height: '100%', overflow: 'auto' }}
        >
          {tabValue === 0 && (
            <List dense disablePadding>
              {Object.keys(filteredSchemas).length === 0 ? (
                <ListItem>
                  <ListItemText 
                    primary="No tables found" 
                    secondary={searchTerm ? "Try a different search term" : "This database has no tables or you don't have permission to view them"}
                  />
                </ListItem>
              ) : (
                Object.keys(filteredSchemas).map(schema => (
                  <React.Fragment key={schema}>
                    <ListItem 
                      button 
                      onClick={() => handleSchemaToggle(schema)}
                      sx={{ bgcolor: 'background.default' }}
                    >
                      <SchemaIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <ListItemText 
                        primary={schema} 
                        primaryTypographyProps={{ fontWeight: 'bold', fontSize: '0.9rem' }}
                        secondary={`${filteredSchemas[schema].length} table${filteredSchemas[schema].length !== 1 ? 's' : ''}`}
                        secondaryTypographyProps={{ fontSize: '0.8rem' }}
                      />
                      {openSchemas[schema] ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                    </ListItem>
                    <Collapse in={openSchemas[schema]} timeout="auto">
                      <List component="div" disablePadding dense>
                        {filteredSchemas[schema].map(table => (
                          <ListItemButton 
                            key={table}
                            sx={{ pl: 4 }}
                            onClick={() => handleTableClick(schema, table)}
                          >
                            <TableIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <ListItemText 
                              primary={table} 
                              primaryTypographyProps={{ fontSize: '0.85rem' }}
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    </Collapse>
                    <Divider />
                  </React.Fragment>
                ))
              )}
            </List>
          )}
        </div>
        
        <div
          role="tabpanel"
          hidden={tabValue !== 1}
          id="schemas-panel"
          aria-labelledby="schemas-tab"
          style={{ padding: '16px', height: '100%', overflow: 'auto' }}
        >
          {tabValue === 1 && (
            <Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {Object.keys(schemas).length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No schemas found
                  </Typography>
                ) : (
                  Object.keys(schemas)
                    .filter(schema => schema.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(schema => (
                      <Chip
                        key={schema}
                        label={schema}
                        icon={<SchemaIcon fontSize="small" />}
                        variant="outlined"
                        color="primary"
                        onClick={() => {
                          setTabValue(0);
                          setOpenSchemas(prev => ({ ...prev, [schema]: true }));
                          setSearchTerm('');
                        }}
                        sx={{ m: 0.5 }}
                        size="small"
                      />
                    ))
                )}
              </Box>
            </Box>
          )}
        </div>
      </Box>
    </Box>
  );
};

export default TableBrowser;