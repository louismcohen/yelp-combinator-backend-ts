# Multi-User MVP Implementation Plan

> **Note**: This plan assumes PostgreSQL migration has been completed before starting multi-user implementation.

## Overview

Implement multi-user support using Supabase Auth for authentication while keeping PostgreSQL for data storage. Users will have access to their own collections/businesses, with database-managed public collections accessible to all (including anonymous users).

## Architecture Overview

- **Supabase Auth**: User authentication (email/password, OAuth, etc.) with anonymous user support
- **PostgreSQL**: Data storage with JSONB for yelpData, PostGIS for geospatial queries, pgvector for embeddings
- **User-Controlled Collections**: Users manage which collections they scrape from via UserCollection model
- **User-Specific Data**: Visited status stored per-user in UserBusiness model
- **Database-Managed Public Collections**: Collections have `isPublic` flag managed by admins

## Key Design Decisions

1. **Centralized Business table** - Shared across all users, contains canonical Yelp data
2. **note field stays in Business** - Comes from Yelp API, not user-specific
3. **visited field moves to UserBusiness** - User-specific interaction data
4. **Collections are global data sources** - Not user-owned, just mapped to users
5. **Anonymous users supported** - Can view public collections and mark visited (migrates on signup)
6. **Public collections in database** - `isPublic` boolean field on Collection model, admin-managed
7. **No sharing features** - Removed from MVP scope (collaborator/read-only roles, share tokens)

## Data Model Changes

### 1. Business Model

- **File**: `backend/src/models/Business.ts` (PostgreSQL)
- **Remove**: `visited` field only
- **Keep**: `note` field (from Yelp API), `alias`, `addedIndex`, `lastUpdated`, `collectionId`, `geoPoint`, `embedding`, `yelpData`
- **Purpose**: Centralized canonical business data

**PostgreSQL Schema**:
```sql
CREATE TABLE businesses (
  id SERIAL PRIMARY KEY,
  alias TEXT UNIQUE NOT NULL,
  collection_id TEXT NOT NULL,
  added_index INTEGER NOT NULL,
  last_updated TIMESTAMP NOT NULL,
  note TEXT, -- From Yelp API
  geo_point GEOGRAPHY(POINT, 4326),
  embedding vector(384),
  yelp_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. UserBusiness Model (New)

- **New File**: `backend/src/models/UserBusiness.ts`
- **Fields**:
  - `userId: String` (required, indexed) - can be anonymous Supabase user ID
  - `businessAlias: String` (required, indexed) - reference to Business.alias
  - `visited: Boolean` (default: false, indexed)
  - Compound unique index on `[userId, businessAlias]`
- **Purpose**: Stores visited status per user (supports anonymous users)

**PostgreSQL Schema**:
```sql
CREATE TABLE user_businesses (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  business_alias TEXT NOT NULL REFERENCES businesses(alias),
  visited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, business_alias)
);

CREATE INDEX idx_user_businesses_user ON user_businesses(user_id);
CREATE INDEX idx_user_businesses_alias ON user_businesses(business_alias);
```

### 3. UserCollection Model (New)

- **New File**: `backend/src/models/UserCollection.ts`
- **Fields**:
  - `userId: String` (required, indexed)
  - `collectionId: String` (Yelp collection ID, required, indexed)
  - `isActive: Boolean` (default: true)
  - Compound unique index on `[userId, collectionId]`
- **Purpose**: Maps which collections each user scrapes from

**PostgreSQL Schema**:
```sql
CREATE TABLE user_collections (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  collection_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, collection_id)
);

CREATE INDEX idx_user_collections_user ON user_collections(user_id);
CREATE INDEX idx_user_collections_collection ON user_collections(collection_id);
```

### 4. Collection Model (Updated)

- **File**: `backend/src/models/Collection.ts`
- **Add**: `isPublic: Boolean` field (default: false, indexed)
- **Purpose**: Track which collections are publicly accessible
- **Management**: Admin-only

**PostgreSQL Schema**:
```sql
CREATE TABLE collections (
  id SERIAL PRIMARY KEY,
  yelp_collection_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  item_count INTEGER NOT NULL,
  last_updated TIMESTAMP NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_collections_public ON collections(is_public);
```

## Schema Type Updates

### 5. Update TypeScript Schemas

- **File**: `backend/src/types/schemas.ts`
- **BusinessSchema**: Remove `visited` field only, keep `note`
- **New**: Add `UserBusinessSchema`, `UserCollectionSchema`
- **CollectionSchema**: Add `isPublic: z.boolean().optional().default(false)`
- Export types: `UserBusiness`, `UserCollection`

## Service Layer Changes

### 6. Business Service Updates

- **File**: `backend/src/services/business.service.ts`
- **Changes**:
  - `getAll(userId?, isAnonymous?)`: 
    - If anonymous: Query businesses where `collectionId` IN (SELECT `yelp_collection_id` FROM collections WHERE `is_public = true`)
    - If authenticated: Return businesses from user's UserCollections
    - Join with UserBusiness to get visited status for userId
  - `updateVisited(businessAlias, userId, visited)`: 
    - Update UserBusiness entry (works for anonymous users too)
    - No permission checks needed (users can only update their own)
  - `upsertBusiness()`: Remove `visited` handling (only handles yelpData, embedding, note)

**PostgreSQL Query Example**:
```sql
-- For anonymous users: get businesses from public collections
SELECT b.*, ub.visited
FROM businesses b
INNER JOIN collections c ON b.collection_id = c.yelp_collection_id
LEFT JOIN user_businesses ub ON b.alias = ub.business_alias AND ub.user_id = $userId
WHERE c.is_public = true;

-- For authenticated users: get businesses from their collections
SELECT b.*, ub.visited
FROM businesses b
INNER JOIN user_collections uc ON b.collection_id = uc.collection_id
LEFT JOIN user_businesses ub ON b.alias = ub.business_alias AND ub.user_id = $userId
WHERE uc.user_id = $userId AND uc.is_active = true;
```

### 7. UserBusiness Service (New)

- **New File**: `backend/src/services/userBusiness.service.ts`
- Methods:
  - `getUserVisitedStatus(userId, businessAliases)`: Get visited status for user
  - `upsertVisited(userId, businessAlias, visited)`: Create/update visited status
  - `bulkGetUserVisitedStatus(userId, businessAliases)`: Efficient batch retrieval
  - `migrateAnonymousData(anonymousUserId, realUserId)`: Migrate anonymous user's visited status to real user on signup
  - `cleanupOrphanedAnonymousData()`: Optional cleanup of old anonymous data

### 8. UserCollection Service (New)

- **New File**: `backend/src/services/userCollection.service.ts`
- Methods:
  - `getUserCollections(userId)`: Get collections user scrapes from
  - `addUserCollection(userId, collectionId)`: Add collection, trigger sync (authenticated only)
  - `removeUserCollection(userId, collectionId)`: Remove collection (authenticated only)
  - `getBusinessesFromUserCollections(userId)`: Get all businesses from user's active collections

### 9. Collection Service Updates

- **File**: `backend/src/services/collection.service.ts`
- **Add method**: `setPublicStatus(collectionId, isPublic, adminUserId)`
  - Verify adminUserId is admin
  - Update Collection.isPublic field
  - Return updated collection
- **Update method**: `getPublicCollections()`
  - Return all collections where `isPublic: true`
  - Used for anonymous user filtering
- **Note**: Sync operations don't need userId (collections are shared data sources)

## Admin Management

### 10. Admin Authentication Helper

- **New File**: `backend/src/utils/adminHelpers.ts`
- Methods:
  - `isAdmin(userId)`: Check if user is admin
  - **Options for admin checking**:
    - **Option A**: Check user metadata/role from Supabase (`user.app_metadata.is_admin === true`)
    - **Option B**: Maintain admin user list in environment variable
    - **Recommendation**: Option A (Supabase metadata) - simplest, leverages existing auth

### 11. Admin Middleware

- **New File**: `backend/src/middleware/admin.middleware.ts`
- `requireAdmin`: Middleware that:
  1. Checks authentication (require valid JWT)
  2. Checks if user is admin (via `isAdmin()` helper)
  3. Rejects with 403 if not admin
  4. Adds `req.admin = true` to request

## Controller Updates

### 12. Business Controller

- **File**: `backend/src/controllers/business.controller.ts`
- **Changes**:
  - `getAll`: 
    - Extract `userId` from `req.user` (may be anonymous Supabase user)
    - Check if anonymous via user metadata or separate check
    - If anonymous: filter by public collections (query database)
    - Join with UserBusiness for visited status
  - `updateVisited`: 
    - Accept userId (anonymous or authenticated)
    - Update UserBusiness entry directly (users can only update their own via auth)

### 13. UserCollection Controller (New)

- **New File**: `backend/src/controllers/userCollection.controller.ts`
- Methods:
  - `getUserCollections`: Get user's collection list (authenticated only)
  - `addCollection`: Add collection, trigger sync (authenticated only)
  - `removeCollection`: Remove collection (authenticated only)
  - `syncCollection`: Trigger sync for user's collection (authenticated only)

### 14. Collection Controller Updates

- **File**: `backend/src/controllers/collection.controller.ts`
- **Add method**: `setPublicStatus`
  - Extract collectionId and isPublic from request
  - Extract adminUserId from req.user
  - Call `collectionService.setPublicStatus()`
  - Return updated collection

### 15. Auth Migration Controller (New)

- **New File**: `backend/src/controllers/authMigration.controller.ts`
- Methods:
  - `migrateAnonymousData`: Migrate anonymous user's data to authenticated user (called on signup)

## Route Updates

### 16. Business Routes

- **File**: `backend/src/routes/business.routes.ts`
- **Changes**:
  - `GET /businesses`: `authenticateOptional` (supports anonymous), filter by public collections if anonymous
  - `PATCH /businesses/:alias/visited`: `authenticateOptional` (supports anonymous), update UserBusiness

### 17. UserCollection Routes (New)

- **New File**: `backend/src/routes/userCollection.routes.ts`
- Routes:
  - `GET /user-collections`: Get user's collections (authenticateRequired)
  - `POST /user-collections`: Add collection (authenticateRequired)
  - `DELETE /user-collections/:collectionId`: Remove (authenticateRequired)
  - `POST /user-collections/:collectionId/sync`: Sync (authenticateRequired)

### 18. Collection Routes Updates

- **File**: `backend/src/routes/collection.routes.ts`
- **Add route**: 
  - `PATCH /collections/:id/public-status` (Admin only)
  - Apply `authenticateRequired` + `requireAdmin` middleware
  - Body: `{ isPublic: boolean }`
  - Updates Collection.isPublic field
- **Optional route**: `GET /collections/public` - List all public collections (anonymous can view)

### 19. Auth Migration Routes (New)

- **New File**: `backend/src/routes/authMigration.routes.ts`
- Routes:
  - `POST /auth/migrate-anonymous-data`: Migrate anonymous user data to authenticated user (authenticateRequired)

## Authentication & Authorization

### 20. Auth Middleware (Anonymous Support)

- **New File**: `backend/src/middleware/auth.middleware.ts`
- `authenticateOptional`: 
  - Extract userId from Supabase JWT if present (includes anonymous users)
  - Anonymous users have `anon` role in Supabase
  - Check user metadata or role to determine if anonymous
  - Add `req.user = { id: string, isAnonymous: boolean } | null`
- `authenticateRequired`: 
  - Require valid Supabase JWT
  - Reject anonymous users (only authenticated users)
  - Add `req.user = { id: string, isAnonymous: false }`

### 21. Anonymous User Detection

- **New File**: `backend/src/utils/authHelpers.ts`
- `isAnonymousUser(user)`: Check if user is anonymous (role === 'anon' or metadata flag)
- `getUserId(req)`: Extract userId from request (works for anonymous)

## Anonymous User Flow

### 22. Anonymous User Behavior

1. **Session Start**: 
   - Frontend creates anonymous Supabase session (automatic)
   - Anonymous user has unique userId from Supabase
   - No signup required

2. **Viewing Businesses**:
   - Can only see businesses from collections where `isPublic: true`
   - Can mark businesses as visited (creates UserBusiness entry with anonymous userId)

3. **Persistence**:
   - Visited status stored in UserBusiness with anonymous userId
   - Persists across browser sessions (as long as anonymous session exists)

4. **Signup/Login**:
   - When anonymous user signs up/logs in:
     - Frontend calls `/auth/migrate-anonymous-data` with anonymous userId
     - Backend migrates all UserBusiness entries from anonymous userId to real userId
     - Anonymous session replaced with authenticated session
     - User now sees their migrated visited status + can manage collections

## Frontend Changes

### 23. Supabase Setup (Anonymous Support)

- **File**: `frontend/src/lib/supabase.ts`
- Configure Supabase to support anonymous users
- Set up automatic anonymous session creation if no user logged in

### 24. Auth Context (Anonymous Support)

- **New File**: `frontend/src/contexts/AuthContext.tsx`
- Detect and expose anonymous user state
- `user`: Can be authenticated user or anonymous user
- `isAnonymous`: Boolean flag
- `isAuthenticated`: Boolean (includes anonymous for viewing, but false for collection management)
- `signUp`, `signIn`, `signOut` methods
- `migrateAnonymousData()`: Call backend migration endpoint on signup

### 25. API Client (Anonymous Support)

- **New File**: `frontend/src/utils/apiClient.ts`
- Include Supabase session token in requests (works for anonymous sessions)
- Handle anonymous user sessions

### 26. Updated Hooks

- **File**: `frontend/src/hooks/useBusinesses.ts`
  - Handle anonymous state
  - Filter by public collections if anonymous (from database)
  - Include visited status from UserBusiness
- **File**: `frontend/src/hooks/useMutateBusiness.ts`
  - Update visited via UserBusiness endpoint (works for anonymous)
- **New File**: `frontend/src/hooks/useUserCollections.ts`
  - Only available for authenticated users (not anonymous)
- **New File**: `frontend/src/hooks/useAuthMigration.ts`
  - Call migration endpoint on signup

### 27. UI Components

- **Auth**: LoginForm, SignUpForm, AuthModal
  - On signup: trigger anonymous data migration
- **Collections**: CollectionManager (authenticated users only)
- **Admin (Optional)**: PublicCollectionToggle component for managing collection public status

### 28. App Integration

- **File**: `frontend/src/main.tsx`
- Wrap with AuthProvider
- Handle anonymous vs authenticated states
- Show collection management only for authenticated users
- Show public collections for anonymous users

## Data Migration

### 29. Migration Script

- **New File**: `backend/src/scripts/migrate-to-user-based.ts`
- Steps:
  1. For each Business with `visited: true`:
     - Identify which user should own it (based on collectionId -> UserCollection mapping, or assign to default user)
     - Create UserBusiness entry with existing `visited: true` value
  2. Create UserCollection entries for existing collections:
     - Assign to default user OR specific userId
  3. Remove `visited` field from Business model:
     - Keep temporarily for backwards compatibility OR
     - Remove immediately after migration
  4. Mark initial collections as public (if desired):
     - Update collections table: `UPDATE collections SET is_public = true WHERE yelp_collection_id IN (...)`

## Authorization Rules Summary

1. **Viewing Businesses**:
   - **Anonymous users**: Only businesses from collections where `isPublic: true`
   - **Authenticated users**: Businesses from their UserCollections

2. **Updating Visited**:
   - **Anonymous users**: Can create/update their own UserBusiness entries
   - **Authenticated users**: Can create/update their own UserBusiness entries

3. **Collection Management**:
   - **Anonymous users**: Cannot manage collections
   - **Authenticated users**: Full CRUD on UserCollections

4. **Public Collection Management**:
   - **Admins only**: Can toggle `isPublic` flag on collections

5. **Data Migration**:
   - On signup: Anonymous UserBusiness entries migrate to authenticated user

## Environment Variables

### Backend `.env`:
```
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
DATABASE_URL=your-postgres-connection-string
# Optional
ADMIN_USER_IDS=user-id-1,user-id-2
```

### Frontend `.env`:
```
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Implementation Checklist

### Backend
- [ ] Add `isPublic` field to Collection model
- [ ] Create UserBusiness model
- [ ] Create UserCollection model
- [ ] Update Business model (remove visited)
- [ ] Update schemas/types
- [ ] Set up Supabase auth middleware with anonymous support
- [ ] Create admin helpers and middleware
- [ ] Create userBusiness service
- [ ] Create userCollection service
- [ ] Update business service
- [ ] Update collection service (add setPublicStatus)
- [ ] Create userCollection controller
- [ ] Create authMigration controller
- [ ] Update business controller
- [ ] Update collection controller (add setPublicStatus)
- [ ] Create userCollection routes
- [ ] Create authMigration routes
- [ ] Update business routes
- [ ] Update collection routes (add public-status endpoint)
- [ ] Create migration script

### Frontend
- [ ] Set up Supabase client with anonymous support
- [ ] Create AuthContext
- [ ] Create API client with auth interceptor
- [ ] Update useBusinesses hook
- [ ] Update useMutateBusiness hook
- [ ] Create useUserCollections hook
- [ ] Create useAuthMigration hook
- [ ] Create auth UI components
- [ ] Create CollectionManager component
- [ ] Integrate AuthProvider in main.tsx
- [ ] Handle anonymous vs authenticated UI states

## Testing Considerations

- [ ] Test anonymous user can view public collections
- [ ] Test anonymous user can mark businesses as visited
- [ ] Test authenticated user can manage collections
- [ ] Test authenticated user sees their own collections' businesses
- [ ] Test anonymous data migration on signup
- [ ] Test admin can toggle collection public status
- [ ] Test non-admin cannot toggle public status
- [ ] Test visited status persists for anonymous users
- [ ] Test visited status query performance with indexes

