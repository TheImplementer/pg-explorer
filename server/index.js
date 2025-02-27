require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const AWS = require('aws-sdk');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection pool
let pool;

// Generate RDS IAM token for authentication
const generateRdsIamToken = async (hostname, port, username, region) => {
  const signer = new AWS.RDS.Signer({
    region: region,
    hostname: hostname,
    port: port,
    username: username
  });
  
  return new Promise((resolve, reject) => {
    signer.getAuthToken({}, (err, token) => {
      if (err) {
        reject(err);
      } else {
        resolve(token);
      }
    });
  });
};

// API Routes
app.post('/api/connect', async (req, res) => {
  try {
    const { host, port, database, user, password, useIam, region } = req.body;
    
    // Close existing pool if exists
    if (pool) {
      await pool.end();
    }
    
    let connectionOptions = {
      host,
      port,
      database,
      user
    };
    
    // Generate RDS IAM token if IAM authentication is enabled
    if (useIam) {
      if (!region) {
        return res.status(400).json({ 
          success: false, 
          message: 'AWS region is required for IAM authentication' 
        });
      }
      
      try {
        const token = await generateRdsIamToken(host, port, user, region);
        connectionOptions.password = token;
        
        // RDS IAM connections require SSL
        connectionOptions.ssl = {
          rejectUnauthorized: true
        };
        
      } catch (iamError) {
        console.error('IAM Token Generation Error:', iamError);
        return res.status(400).json({ 
          success: false, 
          message: `Failed to generate IAM token: ${iamError.message}`
        });
      }
    } else {
      // Use password authentication
      connectionOptions.password = password;
    }
    
    // Create new pool with connection details
    pool = new Pool(connectionOptions);
    
    // Test connection
    const client = await pool.connect();
    client.release();
    
    res.json({ success: true, message: 'Connected successfully' });
  } catch (error) {
    console.error('Connection error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

app.post('/api/query', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!pool) {
      return res.status(400).json({ success: false, message: 'Not connected to database' });
    }
    
    const result = await pool.query(query);
    res.json({ 
      success: true, 
      rows: result.rows,
      rowCount: result.rowCount,
      fields: result.fields 
    });
  } catch (error) {
    console.error('Query error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

app.get('/api/tables', async (req, res) => {
  try {
    if (!pool) {
      return res.status(400).json({ success: false, message: 'Not connected to database' });
    }
    
    const tablesQuery = `
      SELECT 
        table_schema, 
        table_name 
      FROM 
        information_schema.tables 
      WHERE 
        table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY 
        table_schema, table_name;
    `;
    
    const result = await pool.query(tablesQuery);
    res.json({ success: true, tables: result.rows });
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

app.get('/api/columns/:schema/:table', async (req, res) => {
  try {
    if (!pool) {
      return res.status(400).json({ success: false, message: 'Not connected to database' });
    }
    
    const { schema, table } = req.params;
    
    const columnsQuery = `
      SELECT 
        column_name, 
        data_type, 
        is_nullable
      FROM 
        information_schema.columns 
      WHERE 
        table_schema = $1 AND table_name = $2
      ORDER BY 
        ordinal_position;
    `;
    
    const result = await pool.query(columnsQuery, [schema, table]);
    res.json({ success: true, columns: result.rows });
  } catch (error) {
    console.error('Error fetching columns:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Serve static files from the React app
const clientBuildPath = path.join(__dirname, '../client/build');
app.use(express.static(clientBuildPath));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Serving client from: ${clientBuildPath}`);
});