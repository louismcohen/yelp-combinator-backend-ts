// embeddingService.ts
import * as fs from 'fs';
import * as path from 'path';
import { pipeline, Tensor } from '@huggingface/transformers';
import { downloadModels } from '../scripts/download-models';

const MODEL_ID = 'sentence-transformers/all-MiniLM-L6-v2';

// Path to the model cache
const MODEL_CACHE_PATH = path.resolve(
  __dirname,
  '../../cache/models/sentence-transformers/all-MiniLM-L6-v2',
);

// Load the embedding model pipeline
const loadEmbeddingModel = async () => {
  if (!fs.existsSync(MODEL_CACHE_PATH)) {
    console.log('Model cache not found. Downloading model...');
    await downloadModels();
  }

  try {
    const embedder = await pipeline('feature-extraction', MODEL_ID);
    return embedder;
  } catch (error) {
    console.error('Error loading model:', error);
    throw error;
  }
};

interface BusinessForEmbedding {
  visited?: boolean;
  note?: string;
  yelpData?: {
    name: string;
    categories: Array<{
      title: string;
      alias: string;
    }>;
    location: {
      city?: string;
      state?: string;
    };
    is_claimed?: boolean;
    is_closed?: boolean;
    rating?: number;
    review_count?: number;
  };
}

// Generate text embedding for a business
export const createEmbeddingForBusiness = async (
  business: BusinessForEmbedding,
): Promise<number[]> => {
  const textToEmbed = [
    business.yelpData?.name,
    business.yelpData?.categories?.map((c) => c.title).join(', '),
    business?.note,
    `${business.yelpData?.location?.city}, ${business.yelpData?.location?.state}`,
    business.yelpData?.categories?.map((c) => c.alias).join(' '),
    // Status indicators
    business.visited ? 'visited' : 'not visited',
    business.yelpData?.is_claimed ? 'claimed business' : 'unclaimed business',
    business.yelpData?.is_closed && 'permanently closed',
    // Rating and review context
    `rating ${business.yelpData?.rating} stars`,
    `${business.yelpData?.review_count} reviews`,
  ]
    .filter(Boolean)
    .join(' | ')
    .toLowerCase();

  return generateEmbedding(textToEmbed);
};

export const generateEmbedding = async (textToEmbed: string) => {
  try {
    const embedder = await loadEmbeddingModel();

    // Generate the embedding
    const embedding = await embedder(textToEmbed);

    if (embedding instanceof Tensor) {
      return Array.from(embedding.flatten());
    }

    // If it's an array, flatten it and ensure it's an array of numbers
    return Array.from(
      Array.isArray(embedding) ? (embedding as number[][]).flat() : embedding,
    );
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
};
