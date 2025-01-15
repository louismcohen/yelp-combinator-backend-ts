import { Model } from 'mongoose';
import { generateEmbedding } from './embedding.service';

// Search result interface with generic type
interface SearchResult<T> {
  score: number;
  document: T;
}

export const semanticService = {
  async search<T>(
    query: string,
    model: Model<T>,
    limit: number = 20,
    minScore: number = 0,
  ): Promise<SearchResult<T>[]> {
    const queryEmbedding = await generateEmbedding(query);

    if (!Array.isArray(queryEmbedding) || queryEmbedding.length !== 384) {
      throw new Error(
        `Invalid embedding dimension. Expected 384, got ${queryEmbedding.length}`,
      );
    }

    const pipeline = [
      {
        $vectorSearch: {
          index: 'default',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: limit * 10,
          limit: limit,
        },
      },
      {
        $project: {
          score: { $meta: 'vectorSearchScore' },
          document: '$$ROOT',
        },
      },
    ];

    const results = await model.aggregate<SearchResult<T>>(pipeline);
    return results.filter((result) => result.score > minScore);
  },
};
