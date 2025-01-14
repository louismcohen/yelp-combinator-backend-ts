import { env } from './env';

export const yelpConfig = {
  apiKey: env.YELP_API_KEY,
  baseUrl: 'https://api.yelp.com/v3',
  collectionUrl: 'https://www.yelp.com/collection/',
  renderedItemsUrl: 'https://www.yelp.com/collection/user/rendered_items',
  headers: {
    Authorization: `Bearer ${env.YELP_API_KEY}`,
    Accept: 'application/json',
  },
  rateLimit: {
    maxConcurrent: 5,
    minTime: 500,
  },
};
