FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package.json files
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN cd client && npm install
RUN cd server && npm install

# Copy all files
COPY client/ ./client/
COPY server/ ./server/

# Build React app
RUN cd client && npm run build

# Remove development dependencies
RUN cd server && npm prune --production

# Set working directory to server
WORKDIR /app/server

# Expose port
EXPOSE 5000

# Start the application
CMD ["node", "index.js"]