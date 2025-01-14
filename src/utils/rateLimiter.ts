import Bottleneck from 'bottleneck';
import { yelpConfig } from '../config/yelp';

export const yelpLimiter = new Bottleneck({
  maxConcurrent: yelpConfig.rateLimit.maxConcurrent,
  minTime: yelpConfig.rateLimit.minTime,
});
