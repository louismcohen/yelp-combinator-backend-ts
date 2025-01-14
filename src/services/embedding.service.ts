// embeddingService.ts
import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from '@huggingface/transformers';
import { downloadModels } from '../scripts/download-models';
import { Business } from '../types/schemas';
import { Tensor } from '@huggingface/transformers/types/backends/onnx';

// Path to the model cache
const MODEL_CACHE_PATH = path.resolve(
  __dirname,
  '../../cache/models/sentence-transformers/all-MiniLM-L6-v2',
);

// Load the embedding model pipeline
async function loadEmbeddingModel() {
  if (!fs.existsSync(MODEL_CACHE_PATH)) {
    console.log('Model cache not found. Downloading model...');
    await downloadModels();
  }

  const embedder = await pipeline('feature-extraction', MODEL_CACHE_PATH);

  return embedder;
}

// Generate text embedding for a business
export async function createEmbedding(business: Business): Promise<number[]> {
  const textToEmbed = [
    business.yelpData?.name,
    business.yelpData?.categories?.map((c) => c.title).join(', '),
    business.note,
    `${business.yelpData?.location.city}, ${business.yelpData?.location.state}`,
    business.yelpData?.categories?.map((c) => c.alias).join(' '),
    // Status indicators
    business.visited ? 'visited' : 'not visited',
    business.yelpData?.is_claimed ? 'claimed business' : 'unclaimed business',
    // Rating and review context
    `rating ${business.yelpData?.rating} stars`,
    `${business.yelpData?.review_count} reviews`,
  ]
    .filter(Boolean)
    .join(' | ')
    .toLowerCase();

  try {
    const embedder = await loadEmbeddingModel();

    // Generate the embedding
    const embedding = await embedder(textToEmbed);

    if (embedding instanceof Tensor) {
      return [...embedding.flatten()];
    }

    // The pipeline might return a nested array, flatten it
    return Array.isArray(embedding) ? embedding.flat() : embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}
