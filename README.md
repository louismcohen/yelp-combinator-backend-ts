# Yelp Combinator Backend API

A TypeScript backend service that allows users to create collections of businesses from Yelp, add semantic search capabilities, and manage their favorite places. It features natural language search using LLMs to interpret user queries. This backend is designed to power the [Yelp Combinator Frontend](https://github.com/louismcohen/yelp-combinator-frontend) application.

**[Try the live application here](https://yelp-combinator.louiscohen.me)**

## Features

- Integration with Yelp Fusion API for business data
- Collection management for organizing favorite places
- Semantic search using HuggingFace Transformers.js
- Natural language search through AI-powered endpoint
- LLM-based query interpretation with tuned prompts
- Business data caching and embedding generation
- RESTful API with comprehensive documentation

## How It Works

This application is built with:

- **Node.js/Express**: Server framework
- **TypeScript**: Type-safe development
- **HuggingFace Transformers.js**: For generating semantic embeddings
- **Anthropic API**: For natural language understanding and query interpretation
- **MongoDB**: Database for storing collections and business data

The API provides endpoints for:

- Searching Yelp businesses
- Creating and managing collections
- Generating and querying embeddings for semantic search
- AI-powered natural language search via `/search` endpoint
- Converting natural language queries to structured search parameters
- Tracking visited businesses

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/yelp-combinator-backend-ts.git
   cd yelp-combinator-backend-ts
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` with your Yelp API key and other configuration options.

4. Set up the model cache:

   ```bash
   # Create cache directory
   mkdir -p cache/models

   # Download required models
   npm run download-models
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev`: Start development server with hot-reloading
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm run download-models`: Download and cache HuggingFace models

## API Documentation

API documentation is available at `/api-docs` when the server is running.

## Frontend Application

This backend works with a dedicated React frontend application:

- **Repository**: [yelp-combinator-frontend](https://github.com/louismcohen/yelp-combinator-frontend)
- **Features**: 
  - User-friendly interface for browsing and managing collections
  - Search functionality with natural language capabilities
  - Responsive design for mobile and desktop use
  - Integration with map services for business locations
- **Tech Stack**: React, TypeScript, Tailwind CSS

## License

This project is licensed under the MIT License - see the LICENSE file for details.
