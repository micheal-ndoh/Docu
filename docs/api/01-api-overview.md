# API Routes Overview

## API Structure

```
/api
├── auth/
│   ├── [...nextauth]/          # NextAuth.js endpoints
│   │   └── route.ts
│   └── federated-logout/       # Keycloak logout
│       └── route.ts
└── docuseal/
    ├── templates/              # Template management
    │   └── route.ts
    ├── submissions/            # Submission CRUD
    │   ├── route.ts
    │   └── [id]/
    │       ├── documents/
    │       │   └── route.ts
    │       └── route.ts
    └── submitters/             # Submitter management
        ├── route.ts
        └── [id]/
            └── route.ts
```

## Authentication Endpoints

### POST /api/auth/signin/keycloak
**Purpose**: Initiate Keycloak OAuth login  
**Auth**: Public  
**Handler**: NextAuth.js

### GET /api/auth/callback/keycloak
**Purpose**: OAuth callback from Keycloak  
**Auth**: Public  
**Handler**: NextAuth.js

### GET /api/auth/session
**Purpose**: Get current session  
**Auth**: Public  
**Response**:
```json
{
  "user": {
    "id": "user-cuid",
    "email": "user@example.com",
    "name": "User Name"
  },
  "expires": "2025-12-26T00:00:00.000Z"
}
```

### POST /api/auth/signout
**Purpose**: Sign out user  
**Auth**: Authenticated  
**Effect**: Clears session cookie

### GET /api/auth/federated-logout
**Purpose**: Sign out from Keycloak and app  
**Auth**: Authenticated  
**Effect**: Ends Keycloak session + clears app session

## DocuSeal Templates

### GET /api/docuseal/templates
**Purpose**: Fetch all templates  
**Auth**: Authenticated  
**Query Params**:
- `limit` (optional): Number of results (default: 100)
- `after` (optional): Pagination cursor
- `before` (optional): Pagination cursor

**Response**:
```json
{
  "data": [
    {
      "id": 2200443,
      "name": "Template Name",
      "created_at": "2025-11-26T00:00:00.000Z",
      "folder_name": "Default"
    }
  ],
  "pagination": {
    "count": 14,
    "next": 123456,
    "prev": 789012
  }
}
```

## DocuSeal Submissions

### GET /api/docuseal/submissions
**Purpose**: Get user's submissions  
**Auth**: Authenticated  
**Query Params**:
- `status` (optional): Filter by status
- `limit` (optional): Number of results
- `q` (optional): Search query

**Response**:
```json
{
  "data": [
    {
      "id": 4379019,
      "status": "pending",
      "template": {
        "id": 2200443,
        "name": "Template Name"
      },
      "submitters": [
        {
          "id": 5843478,
          "email": "signer@example.com",
          "name": "John Doe",
          "status": "sent",
          "embed_src": "https://docuseal.com/s/unique-slug"
        }
      ],
      "created_at": "2025-11-26T14:19:21.346Z"
    }
  ]
}
```

### POST /api/docuseal/submissions
**Purpose**: Create new submission  
**Auth**: Authenticated  
**Request Body**:
```json
{
  "template_id": 2200443,
  "submitters": [
    {
      "email": "signer@example.com",
      "name": "John Doe",
      "role": "First Party"
    }
  ],
  "send_email": true
}
```

**Response**:
```json
[
  {
    "id": 5843478,
    "submission_id": 4379019,
    "email": "signer@example.com",
    "name": "John Doe",
    "status": "sent",
    "embed_src": "https://docuseal.com/s/unique-slug",
    "sent_at": "2025-11-26T14:19:21.343Z"
  }
]
```

### GET /api/docuseal/submissions/[id]
**Purpose**: Get submission details  
**Auth**: Authenticated  
**Params**: `id` - Submission ID

### DELETE /api/docuseal/submissions/[id]
**Purpose**: Delete submission  
**Auth**: Authenticated  
**Params**: `id` - Submission ID

## Authentication Middleware

All DocuSeal API routes require authentication:

```typescript
const session = await getServerSession(authOptions);

if (!session) {
  return NextResponse.json(
    { message: "Unauthorized" },
    { status: 401 }
  );
}
```

## Error Responses

### 401 Unauthorized
```json
{
  "message": "Unauthorized - please sign in"
}
```

### 400 Bad Request
```json
{
  "message": "template_id is required"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal Server Error",
  "error": "Error details"
}
```

## Rate Limiting

Rate limiting is handled by DocuSeal API. Limits vary by plan.

## CORS

API routes are same-origin only. No CORS configuration needed.
