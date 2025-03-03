# PostgreSQL Explorer

A modern web-based PostgreSQL client application for running queries and exploring database structures. This application is built with React for the frontend and Node.js/Express for the backend.

## Features

- Connect to any PostgreSQL database
- Execute SQL queries with syntax highlighting and auto-completion
- Intelligent SQL editor with context-aware suggestions
- Browse database schema and tables
- Export query results to CSV
- Copy results to clipboard
- Switchable dark/light mode UI with persistent user preference
- AWS IAM authentication support for RDS PostgreSQL databases
- Modern Material Design with CodeMirror editor

## Project Structure

- `/client` - React frontend application
- `/server` - Node.js/Express backend API that also serves the client

## Running with Docker (Recommended)

### Prerequisites

- Docker
- Docker Compose

### Steps to Run

1. Clone the repository:
```bash
git clone <repository-url>
cd pg-explorer
```

2. Start the application with Docker Compose:
```bash
docker-compose up pg-explorer
```

3. Access the application at http://localhost:5000

4. To stop the application:
```bash
docker-compose down
```

## Running Locally

### Prerequisites

- Node.js (v14+)
- npm or yarn
- PostgreSQL server (local or remote)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pg-explorer
```

2. Install dependencies for both client and server:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Running the Application - Development Mode

To run the client and server separately in development mode:

1. Start the combined development environment:
```bash
# From the server directory
cd server
npm run dev:full
```

2. Open your browser and navigate to http://localhost:3000

### Running the Application - Production Mode

To run the application in production mode (single server for API and static files):

1. Build the client and start the server:
```bash
# From the server directory
cd server
npm run deploy
```

2. Open your browser and navigate to http://localhost:5000

## Usage

1. Connect to your PostgreSQL database by providing connection details
2. Use the query editor to write and execute SQL queries
3. Browse database tables and view their schema
4. Click on a table to automatically generate a SELECT query
5. Toggle between dark and light mode using the theme switch button in the top-right corner

### Theme Preferences

The application supports both dark and light themes:

- Click the sun/moon icon in the top-right corner to switch themes
- Theme preference is saved in the browser's localStorage
- Your chosen theme will persist between browser sessions and page refreshes
- SQL editor syntax highlighting automatically adjusts to match the selected theme

### SQL Editor Features

The SQL query editor includes advanced functionality to improve productivity:

- Syntax highlighting for SQL keywords, operators, and functions
- Auto-completion for SQL keywords and commands
- Context-aware suggestions for table columns
- Auto-pairing of brackets and quotes
- Code folding for large queries
- Line numbers and active line highlighting
- Execute queries with Ctrl+Enter keyboard shortcut
- Error messages displayed inline for quick debugging

## Connecting to PostgreSQL

### Standard Authentication
To connect to a PostgreSQL instance with username/password:
- Host address
- Port (default: 5432)
- Database name
- Username
- Password (if required)

### AWS IAM Authentication
For Amazon RDS PostgreSQL instances with IAM authentication enabled:
- Host address (RDS endpoint)
- Port (default: 5432)
- Database name
- IAM username
- AWS Region (e.g., us-east-1)

When using IAM authentication:
1. Toggle "Use AWS IAM Authentication" in the connection form
2. Enter your AWS region
3. Make sure your environment has valid AWS credentials:
   - For local development: configured AWS CLI (~/.aws/credentials)
   - For EC2/ECS: IAM role attached to the instance/task
   - For Lambda: execution role with appropriate permissions

Required AWS permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "rds-db:connect",
      "Resource": "arn:aws:rds-db:[region]:[account-id]:dbuser:[db-resource-id]/[db-username]"
    }
  ]
}
```

## Environment Variables

The Docker setup includes the necessary environment variables. If running locally, create a `.env` file in the server directory with:

```
PORT=5000
```

## Building for Production

To create a production build:

```bash
# Build and run with Docker
docker-compose up pg-explorer

# Or build manually
cd server
npm run deploy
```

## License

This project is licensed under the ISC License.