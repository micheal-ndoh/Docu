# User Filtering Implementation

## Overview
This document describes the implementation of user-specific data filtering for templates and submissions. Each user now sees only their own data.

## Changes Made

### 1. Database Schema Updates (`prisma/schema.prisma`)

Added two new models to track user ownership:

#### **Template Model**
- Links DocuSeal templates to users
- Stores: `userId`, `docusealId`, `name`
- Indexes on `userId` and `docusealId` for fast lookups

#### **Submission Model**
- Links DocuSeal submissions to users
- Stores: `userId`, `docusealId`, `templateId`, `status`, `submitterEmail`
- Indexes on `userId`, `docusealId`, and `submitterEmail`

### 2. Submissions API (`/api/docuseal/submissions/route.ts`)

#### **GET Endpoint (List Submissions)**
- ✅ **Requires authentication** - Returns 401 if no session
- ✅ **Filters by user** - Only returns submissions created by the current user
- **How it works:**
  1. Gets user ID from session
  2. Queries database for user's submissions
  3. Fetches full data from DocuSeal API
  4. Filters results to only include user's submission IDs

#### **POST Endpoint (Create Submission)**
- ✅ **Requires authentication** - Returns 401 if no session
- ✅ **Tracks ownership** - Adds user ID to submitters via `external_id`
- ✅ **Saves to database** - Creates records for tracking
- **How it works:**
  1. Validates user session and gets user ID
  2. Adds `external_id` (user ID) to each submitter
  3. Adds metadata with creator info (`created_by_user_id`, `created_by_email`)
  4. Creates submission in DocuSeal
  5. Saves submission record to local database
  6. Auto-creates template record if it doesn't exist

### 3. Templates API (`/api/docuseal/templates/route.ts`)

#### **GET Endpoint (List Templates)**
- ✅ **Requires authentication** - Returns 401 if no session
- ✅ **Filters by user** - Only returns templates owned by the current user
- **How it works:**
  1. Gets user ID from session
  2. Queries database for user's templates
  3. Fetches all templates from DocuSeal API
  4. Filters results to only include user's template IDs

#### **POST Endpoint (Create Template)**
- ✅ **Requires authentication** - Already had this
- ✅ **Tracks ownership** - Saves template to database with user ID
- **How it works:**
  1. Creates template in DocuSeal (existing logic)
  2. Saves template record to local database with user ID

## Database Migration Required

Before testing, you need to run the migration:

```bash
# If using Docker
docker-compose exec nextjs-app npx prisma migrate dev --name add_user_template_submission_tracking

# Or locally
npx prisma migrate dev --name add_user_template_submission_tracking
```

This will create the `Template` and `Submission` tables in your PostgreSQL database.

## How User Filtering Works

### Architecture
```
┌─────────────┐
│   User A    │
└──────┬──────┘
       │
       ├─ Creates Template 1 ──► Saved to DB with userId = A
       │                         Saved to DocuSeal with id = 101
       │
       ├─ Creates Submission 1 ─► Saved to DB with userId = A
       │                          Saved to DocuSeal with external_id = A
       │
       └─ Views Templates ───────► DB query: WHERE userId = A
                                   Returns only Template 1
```

### Data Flow

**Creating a Submission:**
1. User creates submission via frontend
2. API adds user's ID as `external_id` to submitters
3. DocuSeal creates submission and returns submitter data
4. API saves submission to local DB with user ID
5. User can now see this submission in their list

**Viewing Submissions:**
1. User requests submissions list
2. API queries local DB: `SELECT * FROM Submission WHERE userId = currentUser`
3. Gets list of DocuSeal submission IDs
4. Fetches full data from DocuSeal API
5. Filters to only include user's submissions
6. Returns filtered list to frontend

## Security Benefits

1. **No cross-user data leakage** - Users can only see their own data
2. **Database-backed filtering** - Not relying solely on DocuSeal metadata
3. **Session-based authentication** - All endpoints require valid session
4. **Audit trail** - Database records show who created what and when

## Testing Checklist

After running the migration, test the following:

- [ ] User A creates a template → Only User A can see it
- [ ] User B creates a template → Only User B can see it
- [ ] User A creates a submission → Only User A can see it
- [ ] User B cannot see User A's submissions
- [ ] Unauthenticated users get 401 errors
- [ ] Template creation saves to database
- [ ] Submission creation saves to database

## Notes

- **Backwards Compatibility:** Existing templates/submissions in DocuSeal won't appear until they're recreated or manually added to the database
- **Performance:** Database queries are indexed for fast lookups
- **Error Handling:** If database save fails, the DocuSeal operation still succeeds (logged but not failed)
- **External ID:** Used to link DocuSeal submitters back to our users

## Next Steps

1. Run the database migration
2. Test with multiple user accounts
3. Consider adding a sync script to import existing DocuSeal data
4. Implement the remaining fixes:
   - Remove file upload functionality
   - Change email notifications to in-app signing
   - Rebrand the application
