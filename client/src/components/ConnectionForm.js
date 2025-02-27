import React, { useState } from 'react';
import { 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  Grid,
  Alert,
  Collapse,
  IconButton,
  FormControlLabel,
  Switch,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

const ConnectionForm = ({ onConnect }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useIam, setUseIam] = useState(false);
  const [formData, setFormData] = useState({
    host: 'localhost',
    port: '5432',
    database: '',
    user: '',
    password: '',
    region: 'us-east-1',
    useIam: false
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleIamToggle = (e) => {
    const useIamAuth = e.target.checked;
    setUseIam(useIamAuth);
    setFormData({
      ...formData,
      useIam: useIamAuth
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post('/api/connect', formData);
      onConnect();
    } catch (err) {
      console.error('Connection error:', err);
      setError(err.response?.data?.message || 'Failed to connect to database');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%'
      }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          width: '100%', 
          maxWidth: 500,
        }}
      >
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Connect to PostgreSQL Database
        </Typography>
        
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
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={8}>
              <TextField
                fullWidth
                label="Host"
                name="host"
                value={formData.host}
                onChange={handleChange}
                margin="normal"
                required
                placeholder="my-rds-instance.amazonaws.com"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Port"
                name="port"
                value={formData.port}
                onChange={handleChange}
                margin="normal"
                required
                type="number"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Database"
                name="database"
                value={formData.database}
                onChange={handleChange}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Username"
                name="user"
                value={formData.user}
                onChange={handleChange}
                margin="normal"
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel 
                control={
                  <Switch 
                    checked={useIam} 
                    onChange={handleIamToggle} 
                    name="useIam" 
                  />
                } 
                label="Use AWS IAM Authentication" 
              />
              <Typography variant="caption" color="text.secondary" display="block">
                For Amazon RDS PostgreSQL instances with IAM authentication enabled
              </Typography>
            </Grid>
            
            {useIam ? (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="AWS Region"
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  margin="normal"
                  required
                  placeholder="us-east-1"
                />
                <Typography variant="caption" color="text.secondary">
                  Make sure your AWS environment is configured with the appropriate credentials
                </Typography>
              </Grid>
            ) : (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  margin="normal"
                  type="password"
                />
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? 'Connecting...' : 'Connect'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default ConnectionForm;