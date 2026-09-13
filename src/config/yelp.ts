import { env } from './env';

export const yelpConfig = {
  apiKey: env.YELP_API_KEY,
  baseUrl: 'https://api.yelp.com/v3',
  collectionUrl: 'https://www.yelp.com/collection/',
  gqlBatchUrl: 'https://www.yelp.com/gql/batch',
  renderedItemsUrl: 'https://www.yelp.com/collection/user/rendered_items',
  getCollectionItemsPageDocumentId: env.YELP_GQL_COLLECTION_ITEMS_DOCUMENT_ID,
  renderedItemsFallbackEnabled: env.YELP_SCRAPER_RENDERED_ITEMS_FALLBACK,
  browserHeaders: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
  },
  headers: {
    Authorization: `Bearer ${env.YELP_API_KEY}`,
    Accept: 'application/json',
  },
  rateLimit: {
    maxConcurrent: 5,
    minTime: 500,
  },
};
