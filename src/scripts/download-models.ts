// src/scripts/download-models.ts
import { pipeline, env } from '@huggingface/transformers';
import path from 'path';

env.cacheDir = path.join(process.cwd(), 'cache/models');

export const downloadModels = async () => {
  console.log('Downloading models...');
  try {
    await pipeline(
      'feature-extraction',
      'sentence-transformers/all-MiniLM-L6-v2',
    );
    console.log('Models downloaded successfully!');
  } catch (error) {
    console.error('Failed to download models:', error);
    process.exit(1);
  }
};

downloadModels();
