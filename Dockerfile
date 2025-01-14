FROM node:18-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Create cache directory
RUN mkdir -p cache/models

# Download models during build
RUN npm run download-models

# Build the application
RUN npm run build

# Start the application
CMD ["npm", "start"]