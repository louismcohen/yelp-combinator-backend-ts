# Yelp Collection API

API for managing Yelp collections and businesses.

## Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and fill in your values
3. Run development server: `npm run dev`

### Model Cache

This project uses HuggingFace Transformers.js for generating embeddings. The model files are cached locally for better performance.

First-time setup:

```bash
# Create cache directory
mkdir -p cache/models

# Download models (this may take a few minutes)
npm run download-models

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm start`: Start production server

## API Documentation

Available at `/api-docs` when server is running.

```
