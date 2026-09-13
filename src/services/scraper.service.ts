// services/scraper.service.ts
import * as cheerio from 'cheerio';
import axios from 'axios';
import { yelpConfig } from '../config/yelp';
import { yelpLimiter } from '../utils/rateLimiter';
import type {
  ScrapedBusiness,
  ScrapedCollection,
  ScrapeResult,
} from '../types/scraper.types';

interface GondolaCollectionMeta {
  id: string;
  itemCount: number;
  lastUpdatedMetatag: string;
  name: string;
}

interface CollectionItemsPageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

interface CollectionItemEdge {
  node?: {
    comment?: string | null;
    business?: {
      alias?: string | null;
    } | null;
  } | null;
}

interface GetCollectionItemsPageResponse {
  errors?: Array<{ message?: string }>;
  data?: {
    userCollection?: {
      encid?: string;
      itemCount?: number;
      items?: {
        totalCount?: number;
        pageInfo?: CollectionItemsPageInfo;
        edges?: CollectionItemEdge[];
      } | null;
    } | null;
  } | null;
}

const PAGE_SIZE = 30;

/**
 * Extract the gondola `collection` object for a given collection id from page HTML.
 */
function extractGondolaCollection(
  html: string,
  collectionId: string,
): GondolaCollectionMeta | null {
  const markers = [`"id":"${collectionId}"`, `"id": "${collectionId}"`];
  let idIndex = -1;
  for (const marker of markers) {
    idIndex = html.indexOf(marker);
    if (idIndex !== -1) {
      break;
    }
  }
  if (idIndex === -1) {
    return null;
  }

  // Walk backwards to the opening `{` of the collection object.
  let start = idIndex;
  while (start > 0 && html[start] !== '{') {
    start -= 1;
  }
  if (html[start] !== '{') {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < html.length; i += 1) {
    const char = html[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        try {
          const parsed = JSON.parse(
            html.slice(start, i + 1),
          ) as Partial<GondolaCollectionMeta>;
          if (
            parsed.id === collectionId &&
            typeof parsed.itemCount === 'number' &&
            typeof parsed.lastUpdatedMetatag === 'string' &&
            typeof parsed.name === 'string'
          ) {
            return {
              id: parsed.id,
              itemCount: parsed.itemCount,
              lastUpdatedMetatag: parsed.lastUpdatedMetatag,
              name: parsed.name,
            };
          }
        } catch {
          return null;
        }
        return null;
      }
    }
  }

  return null;
}

/**
 * Heuristic for an actual block page. Normal Yelp HTML loads DataDome scripts,
 * so do not treat a bare "datadome" substring as a challenge.
 */
function looksLikeChallengePage(html: string): boolean {
  const lower = html.toLowerCase();
  return (
    lower.includes('pardon our interruption') ||
    lower.includes('please verify you are a human') ||
    (lower.includes('access denied') && html.length < 50_000)
  );
}

function isPersistedQueryFailure(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('persisted') ||
    lower.includes('documentid') ||
    lower.includes('document id') ||
    lower.includes('unknown query') ||
    lower.includes('query not found') ||
    lower.includes('apq') ||
    lower.includes('forbidden') ||
    lower.includes('graphql http 403') ||
    lower.includes('graphql http 404')
  );
}

/**
 * Loud, greppable log when GetCollectionItemsPage fails so we can track
 * documentId rotations in Railway logs.
 */
function logGqlCollectionItemsFailure(
  collectionId: string,
  error: string,
): void {
  const documentId = yelpConfig.getCollectionItemsPageDocumentId;
  const likelyPersistedIdIssue = isPersistedQueryFailure(error);
  console.error(
    `[YELP_GQL_COLLECTION_ITEMS_FAILURE] collectionId=${collectionId} documentId=${documentId} likelyPersistedIdIssue=${likelyPersistedIdIssue} error=${error}`,
  );
  if (likelyPersistedIdIssue) {
    console.error(
      `[YELP_GQL_PERSISTED_QUERY_FAILURE] GetCollectionItemsPage documentId may have changed. Update YELP_GQL_COLLECTION_ITEMS_DOCUMENT_ID (current=${documentId}).`,
    );
  }
}

function withReverseAddedIndexes(
  businesses: ScrapedBusiness[],
): ScrapedBusiness[] {
  const total = businesses.length;
  return businesses.map((business, index) => ({
    ...business,
    addedIndex: total - index - 1,
  }));
}

function scrapeBusinessFromElement(
  $element: {
    find: (selector: string) => {
      attr: (name: string) => string | undefined;
      text: () => string;
    };
  },
  addedIndex: number,
): ScrapedBusiness {
  const encodedBizUrl = $element.find('.biz-name').attr('href') || '';
  const bizUrl = decodeURIComponent(encodedBizUrl);
  const bizAlias = decodeURIComponent(bizUrl.split('?')[0].slice(5));

  if (!bizAlias) {
    throw new Error('Failed to parse business data');
  }

  return {
    alias: bizAlias,
    note: $element.find('.js-info-content').text().trim() || undefined,
    addedIndex,
  };
}

export const scraperService = {
  async scrapeCollection(
    collectionId: string,
  ): Promise<ScrapeResult<ScrapedCollection>> {
    try {
      const response = await yelpLimiter.schedule(() =>
        axios.get<string>(`${yelpConfig.collectionUrl}${collectionId}`, {
          headers: {
            Accept: 'text/html',
            ...yelpConfig.browserHeaders,
          },
          responseType: 'text',
        }),
      );

      const html = response.data;
      if (typeof html !== 'string' || html.length === 0) {
        console.error(
          `Empty collection page for ${collectionId} (status ${response.status})`,
        );
        return {
          success: false,
          error: `Empty collection page (status ${response.status})`,
        };
      }

      const meta = extractGondolaCollection(html, collectionId);
      if (!meta) {
        if (looksLikeChallengePage(html)) {
          console.error(
            `Collection page for ${collectionId} looks like a bot challenge (status ${response.status}, body length ${html.length})`,
          );
          return {
            success: false,
            error: 'Collection page blocked by bot challenge',
          };
        }
        console.error(
          `Gondola collection JSON not found for ${collectionId} (status ${response.status}, body length ${html.length})`,
        );
        return {
          success: false,
          error: 'Collection metadata JSON not found in page HTML',
        };
      }

      if (!Number.isFinite(meta.itemCount)) {
        return {
          success: false,
          error: `Invalid itemCount in collection metadata: ${String(meta.itemCount)}`,
        };
      }

      const lastUpdated = new Date(meta.lastUpdatedMetatag);
      if (Number.isNaN(lastUpdated.getTime())) {
        return {
          success: false,
          error: `Invalid lastUpdatedMetatag: ${meta.lastUpdatedMetatag}`,
        };
      }

      const collection: ScrapedCollection = {
        yelpCollectionId: collectionId,
        title: meta.name,
        itemCount: meta.itemCount,
        lastUpdated,
        items: [],
      };

      return { success: true, data: collection };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Primary path: Yelp persisted GraphQL GetCollectionItemsPage.
   */
  async scrapeCollectionBusinessesViaGql(
    collectionId: string,
    itemCount: number,
  ): Promise<ScrapeResult<ScrapedBusiness[]>> {
    try {
      const businesses: ScrapedBusiness[] = [];
      let after: string | null = null;
      let hasNextPage = true;
      let pagesFetched = 0;

      while (hasNextPage) {
        const response = await yelpLimiter.schedule(() =>
          axios.post<GetCollectionItemsPageResponse[]>(
            yelpConfig.gqlBatchUrl,
            [
              {
                operationName: 'GetCollectionItemsPage',
                variables: {
                  collectionEncid: collectionId,
                  first: PAGE_SIZE,
                  after,
                  includeBusinessDicts: true,
                  sortBy: 'DATE',
                },
                extensions: {
                  operationType: 'query',
                  documentId: yelpConfig.getCollectionItemsPageDocumentId,
                },
              },
            ],
            {
              headers: {
                Accept: '*/*',
                'Content-Type': 'application/json',
                Origin: 'https://www.yelp.com',
                Referer: `${yelpConfig.collectionUrl}${collectionId}`,
                'x-apollo-operation-name': 'GetCollectionItemsPage',
                ...yelpConfig.browserHeaders,
              },
              validateStatus: () => true,
            },
          ),
        );

        if (response.status === 403 || response.status === 404) {
          return {
            success: false,
            error: `GraphQL HTTP ${response.status} for GetCollectionItemsPage`,
          };
        }

        if (response.status >= 400) {
          return {
            success: false,
            error: `GraphQL HTTP ${response.status} for GetCollectionItemsPage`,
          };
        }

        const batchResult = response.data?.[0];
        if (!batchResult) {
          return {
            success: false,
            error: 'Empty GraphQL batch response for GetCollectionItemsPage',
          };
        }

        if (batchResult.errors?.length) {
          const message = batchResult.errors
            .map((err) => err.message ?? 'Unknown GraphQL error')
            .join('; ');
          return {
            success: false,
            error: `GraphQL errors: ${message}`,
          };
        }

        const items = batchResult.data?.userCollection?.items;
        if (!items) {
          return {
            success: false,
            error: 'Missing data.userCollection.items in GraphQL response',
          };
        }

        const edges = items.edges ?? [];
        for (const edge of edges) {
          const alias = edge.node?.business?.alias;
          if (!alias) {
            continue;
          }
          const note = edge.node?.comment?.trim() ?? '';
          businesses.push({
            alias,
            note: note || undefined,
            // Temporary index; rewritten after all pages are fetched.
            addedIndex: businesses.length,
          });
        }

        pagesFetched += 1;
        hasNextPage = Boolean(items.pageInfo?.hasNextPage);
        after = items.pageInfo?.endCursor ?? null;

        console.log(
          `Scraped ${businesses.length} of ${itemCount} businesses via GQL (page ${pagesFetched})`,
        );

        if (hasNextPage && !after) {
          return {
            success: false,
            error:
              'GraphQL pageInfo.hasNextPage is true but endCursor is missing',
          };
        }
      }

      return { success: true, data: withReverseAddedIndexes(businesses) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Fallback path: legacy rendered_items HTML markup.
   */
  async scrapeCollectionBusinessesViaRenderedItems(
    collectionId: string,
    itemCount: number,
  ): Promise<ScrapeResult<ScrapedBusiness[]>> {
    try {
      const businesses: ScrapedBusiness[] = [];
      const offsetStep = 30;

      for (let offset = 0; offset < itemCount; offset += offsetStep) {
        const response = await yelpLimiter.schedule(() =>
          axios.get<{ list_markup?: string }>(yelpConfig.renderedItemsUrl, {
            params: {
              collection_id: collectionId,
              offset,
              sort_by: 'date',
            },
            headers: {
              Accept: 'application/json',
              ...yelpConfig.browserHeaders,
            },
          }),
        );

        if (!response.data.list_markup) {
          return {
            success: false,
            error: 'Failed to get rendered items',
          };
        }

        const $ = cheerio.load(response.data.list_markup);

        $('.collection-item').each((index, element) => {
          const $element = $(element);
          try {
            const business = scrapeBusinessFromElement(
              $element,
              itemCount - offset - index - 1,
            );
            businesses.push(business);
          } catch (error) {
            console.error('Failed to parse business element:', error);
          }
        });

        console.log(
          `Scraped ${businesses.length} of ${itemCount} businesses via rendered_items (offset ${offset})`,
        );
      }

      return { success: true, data: businesses };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async scrapeCollectionBusinesses(
    collectionId: string,
    itemCount: number,
  ): Promise<ScrapeResult<ScrapedBusiness[]>> {
    const gqlResult = await this.scrapeCollectionBusinessesViaGql(
      collectionId,
      itemCount,
    );

    if (gqlResult.success) {
      return gqlResult;
    }

    logGqlCollectionItemsFailure(collectionId, gqlResult.error);

    if (!yelpConfig.renderedItemsFallbackEnabled) {
      return gqlResult;
    }

    console.warn(
      `[YELP_GQL_FALLBACK] Falling back to rendered_items for collection ${collectionId} after GQL failure: ${gqlResult.error}`,
    );

    const fallbackResult = await this.scrapeCollectionBusinessesViaRenderedItems(
      collectionId,
      itemCount,
    );

    if (!fallbackResult.success) {
      console.error(
        `[YELP_GQL_FALLBACK_FAILED] rendered_items fallback also failed for ${collectionId}: ${fallbackResult.error}`,
      );
      return {
        success: false,
        error: `GQL failed (${gqlResult.error}); rendered_items fallback failed (${fallbackResult.error})`,
      };
    }

    console.warn(
      `[YELP_GQL_FALLBACK_SUCCESS] rendered_items recovered ${fallbackResult.data.length} businesses for ${collectionId}`,
    );
    return fallbackResult;
  },

  async scrapeFullCollection(
    collectionId: string,
  ): Promise<ScrapeResult<ScrapedCollection>> {
    try {
      const collectionResult = await this.scrapeCollection(collectionId);
      if (!collectionResult.success) {
        return collectionResult;
      }

      const businessesResult = await this.scrapeCollectionBusinesses(
        collectionId,
        collectionResult.data.itemCount,
      );
      if (!businessesResult.success) {
        return businessesResult;
      }

      return {
        success: true,
        data: {
          ...collectionResult.data,
          items: businessesResult.data,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
