#!/bin/bash

# # Create a new directory and initialize project
# echo "🚀 Creating new project directory..."
# mkdir yelp-collection-api
# cd yelp-collection-api

# Initialize npm and git
echo "📦 Initializing npm project..."
npm init -y

# Initialize git
echo "📚 Initializing git repository..."
git init

# Update package.json with basic scripts
npm pkg set scripts.dev="ts-node-dev --respawn --transpile-only src/server.ts"
npm pkg set scripts.build="tsc"
npm pkg set scripts.start="node dist/server.js"

# Install dependencies
echo "📥 Installing dependencies..."
npm install express mongoose axios cheerio bottleneck cors helmet \
    swagger-jsdoc swagger-ui-express dotenv zod tz-lookup

# Install dev dependencies
echo "📥 Installing dev dependencies..."
npm install -D typescript ts-node-dev @types/node @types/express \
    @types/cors @types/swagger-jsdoc @types/swagger-ui-express \
    eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin \
    prettier jest ts-jest @types/jest supertest @types/supertest

# Create typescript config
echo "⚙️ Creating TypeScript configuration..."
npx tsc --init

# Create project structure
echo "📁 Creating project structure..."
mkdir -p src/{config,controllers,middleware,models,routes,services,types,utils/errors}

# Create base files
echo "📝 Creating base files..."

# Create .env file
cat > .env << EOL
NODE_ENV=development
PORT=3000
MONGODB_URI=
YELP_API_KEY=
EOL

# # Create .gitignore
# cat > .gitignore << EOL
# node_modules/
# dist/
# .env
# .env.*
# !.env.example
# .DS_Store
# coverage/
# *.log
# EOL

# Create source files
cat > src/app.ts << EOL
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { businessRoutes } from './routes/business.routes';
import { collectionRoutes } from './routes/collection.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/businesses', businessRoutes);
app.use('/api/collections', collectionRoutes);

app.use(errorHandler);

export { app };
EOL

cat > src/server.ts << EOL
import mongoose from 'mongoose';
import { app } from './app';
import { env } from './config/env';

const startServer = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    app.listen(env.PORT, () => {
      console.log(\`Server running on port \${env.PORT}\`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
EOL

# Create placeholder files for structure
touch src/config/env.ts
touch src/controllers/{business,collection}.controller.ts
touch src/middleware/{error,validation}.middleware.ts
touch src/models/{Business,Collection}.ts
touch src/routes/{business,collection}.routes.ts
touch src/services/{business,collection,scraper,yelpAPI}.service.ts
touch src/types/{business,collection,global}.d.ts
touch src/utils/asyncHandler.ts
touch src/utils/errors/index.ts

# Optional: Initialize ESLint
echo "🎨 Initializing ESLint..."
npx eslint --init

# Create README
cat > README.md << EOL
# Yelp Collection API

API for managing Yelp collections and businesses.

## Setup

1. Install dependencies: \`npm install\`
2. Copy \`.env.example\` to \`.env\` and fill in your values
3. Run development server: \`npm run dev\`

## Available Scripts

- \`npm run dev\`: Start development server
- \`npm run build\`: Build for production
- \`npm start\`: Start production server

## API Documentation

Available at \`/api-docs\` when server is running.
EOL

echo "✅ Project setup complete!"
echo "🚀 To get started:"
echo "1. Update .env with your configuration"
echo "2. Run 'npm run dev' to start the development server"

# After the existing script content, add:

# Create ESLint config
cat > .eslintrc.json << EOL
{
  "env": {
    "es2021": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "plugins": [
    "@typescript-eslint",
    "prettier"
  ],
  "rules": {
    "prettier/prettier": "error",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["error", {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_"
    }]
  }
}
EOL

# Create Prettier config
cat > .prettierrc << EOL
{
  "singleQuote": true,
  "trailingComma": "all",
  "tabWidth": 2,
  "semi": true,
  "printWidth": 80,
  "bracketSpacing": true,
  "endOfLine": "lf"
}
EOL

# Add format scripts to package.json
npm pkg set scripts.format="prettier --write 'src/**/*.{js,ts}'"
npm pkg set scripts.lint="eslint 'src/**/*.{js,ts}' --fix"

# Create VS Code settings for consistent formatting
mkdir -p .vscode
cat > .vscode/settings.json << EOL
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "typescript.updateImportsOnFileMove.enabled": "always"
}
EOL

# Install additional ESLint/Prettier dependencies
npm install -D eslint-config-prettier eslint-plugin-prettier