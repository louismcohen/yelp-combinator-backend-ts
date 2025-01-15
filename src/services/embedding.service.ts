// embeddingService.ts
import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from '@huggingface/transformers';
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
  alias: string;
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

interface WeightedField {
  value: string | undefined | null;
  weight: number;
  preprocessor?: (value: string) => string;
}

// Generate text embedding for a business
export const createEmbeddingForBusiness = async (
  business: BusinessForEmbedding,
): Promise<number[]> => {
  const textToEmbed = getBusinessEmbeddingText(business);

  console.log({
    createEmbeddingForBusiness: business.alias,
    text: textToEmbed,
  });

  return generateEmbedding(textToEmbed);
};

export const generateEmbedding = async (textToEmbed: string) => {
  try {
    const embedder = await loadEmbeddingModel();

    // Generate the embedding
    const embedding = await embedder(textToEmbed);

    // const multiDimEmbedding: number[] = embedding instanceof Tensor ? Array.from(embedding.flatten()) : Array.from(
    //   Array.isArray(embedding) ? (embedding as number[][]).flat() : embedding,
    // );

    const pooledEmbedding = embedding.mean(1);
    return Array.from(pooledEmbedding.flatten());
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
};

const createWeightedEmbeddingText = (fields: WeightedField[]): string => {
  return fields
    .flatMap(({ value, weight, preprocessor = (v) => v }) =>
      value ? Array(weight).fill(preprocessor(value)) : [],
    )
    .join(' | ')
    .toLowerCase();
};

const getBusinessEmbeddingText = (business: BusinessForEmbedding) => {
  const fields: WeightedField[] = [
    // High importance (weight: 3)
    {
      value: business.yelpData?.name,
      weight: 3,
    },
    {
      value: business.yelpData?.categories?.map((c) => c.title).join(', '),
      weight: 3,
    },
    {
      value: business.note,
      weight: 3,
    },

    // Medium importance (weight: 2)
    {
      value:
        (business.yelpData?.rating ?? 0) >= 4
          ? 'highly rated restaurant'
          : undefined,
      weight: 2,
    },
    {
      value: business.visited ? 'visited' : 'not visited',
      weight: 2,
    },
    {
      value: business.yelpData?.is_claimed ? 'claimed' : 'unclaimed',
      weight: 2,
    },

    // Standard importance (weight: 1)
    {
      value: `${business.yelpData?.location?.city}, ${business.yelpData?.location?.state}`,
      weight: 1,
    },
    {
      value: `rating ${business.yelpData?.rating} stars with ${business.yelpData?.review_count} reviews`,
      weight: 1,
    },
    {
      value: business.yelpData?.categories?.map((c) => c.alias).join(' '),
      weight: 1,
    },
  ];

  return createWeightedEmbeddingText(fields);
};
