# System Overview

## Project Description

**Docu-Keycloak** is a Next.js application that provides document signing capabilities through DocuSeal integration, with enterprise-grade authentication via Keycloak SSO.

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
    end
    
    subgraph "Application Layer - Next.js 14"
        App[Next.js App]
        API[API Routes]
        Auth[NextAuth.js]
    end
    
    subgraph "Authentication Layer"
        KC[Keycloak Server]
        KCDB[(Keycloak DB)]
    end
    
    subgraph "Data Layer"
        AppDB[(PostgreSQL)]
        Prisma[Prisma ORM]
    end
    
    subgraph "External Services"
        DocuSeal[DocuSeal API]
    end
    
    Browser -->|HTTPS| App
    App -->|Auth Requests| Auth
    Auth -->|OAuth 2.0/OIDC| KC
    KC -->|User Data| KCDB
    Auth -->|User Sync| Prisma
    Prisma -->|SQL| AppDB
    API -->|HTTP| DocuSeal
    App -->|API Calls| API
    
    style Browser fill:#e3f2fd
    style App fill:#fff3e0
    style Auth fill:#f3e5f5
    style KC fill:#e1f5ff
    style AppDB fill:#e8f5e9
    style DocuSeal fill:#fce4ec
```

## Core Components

### 1. Frontend (Next.js App Router)

**Technology Stack**:
- Next.js 14.2.18 (App Router)
- React 18.3.1
- TypeScript 5.9.3
- Tailwind CSS
- Radix UI / Shadcn/ui

**Key Pages**:
- `/` - Landing page
- `/submissions` - Submission management (protected)
- `/templates` - Template browsing (protected)

**Features**:
- Server-side rendering (SSR)
- Client-side navigation
- Protected routes via middleware
- Responsive design

### 2. Authentication (Keycloak + NextAuth.js)

**Keycloak**:
- Enterprise SSO provider
- OAuth 2.0 / OpenID Connect
- Centralized user management
- Role-based access control (RBAC)

**NextAuth.js**:
- Session management
- JWT token handling
- User synchronization
- Middleware protection

**Flow**:
```
User Login → Keycloak Auth → JWT Token → NextAuth Session → App Access
```

### 3. API Layer

**Structure**:
```
/api
├── auth/[...nextauth]     # NextAuth endpoints
├── docuseal/
│   ├── templates/         # Template fetching
│   ├── submissions/       # Submission CRUD
│   └── submitters/        # Submitter management
└── auth/
    └── federated-logout/  # Keycloak logout
```

**Responsibilities**:
- Proxy requests to DocuSeal API
- Enforce authentication
- Data validation
- Database operations
- Error handling

### 4. Database (PostgreSQL + Prisma)

**Prisma ORM**:
- Type-safe database client
- Schema migrations
- Query builder
- Connection pooling

**Models**:
- `User` - Application users (synced from Keycloak)
- `Submission` - Document submissions
- `Account` - OAuth accounts (NextAuth)
- `Session` - User sessions (NextAuth)

### 5. External Integration (DocuSeal)

**DocuSeal API**:
- Official cloud API: `https://api.docuseal.com`
- Document template management
- E-signature workflows
- PDF generation
- Email notifications

**Integration Pattern**:
```
App → API Route → DocuSeal API → Response → Database → Client
```

## Data Flow

### Complete Request Flow

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant N as Next.js
    participant A as Auth
    participant K as Keycloak
    participant D as Database
    participant DS as DocuSeal

    U->>B: Access /submissions
    B->>N: GET /submissions
    N->>A: Check session
    
    alt No session
        A->>B: Redirect to login
        B->>K: OAuth login
        K->>B: Return token
        B->>A: Create session
        A->>D: Sync user
    end
    
    A->>N: Session valid
    N->>B: Render page
    B->>N: Fetch submissions
    N->>D: Query user submissions
    D->>N: Return submission IDs
    N->>DS: Fetch submission details
    DS->>N: Return submissions
    N->>B: Display submissions
```

## Environment Variables

### Required Configuration

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/docu"
DIRECT_DATABASE_URL="postgresql://user:password@localhost:5432/docu"

# Keycloak
KEYCLOAK_ID="your-client-id"
KEYCLOAK_SECRET="your-client-secret"
KEYCLOAK_ISSUER="http://keycloak-server:8080/realms/docu"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# DocuSeal
DOCUSEAL_URL="https://api.docuseal.com"
DOCUSEAL_API_KEY="your-docuseal-api-key"
```

## Security Considerations

### Authentication
- ✅ OAuth 2.0 / OIDC standard
- ✅ JWT tokens with expiration
- ✅ Secure session storage
- ✅ CSRF protection (NextAuth)

### Authorization
- ✅ Middleware route protection
- ✅ Server-side session validation
- ✅ User-specific data filtering
- ✅ Foreign key constraints

### API Security
- ✅ API key authentication (DocuSeal)
- ✅ Request validation
- ✅ Error sanitization
- ✅ Rate limiting (via DocuSeal)

## Performance Optimizations

### Frontend
- Server-side rendering (SSR)
- Static generation where possible
- Code splitting
- Image optimization

### Backend
- Database connection pooling
- Query optimization
- Caching strategies
- Async operations

### Database
- Indexed columns (userId, docusealId)
- Foreign key constraints
- Efficient queries via Prisma

## Deployment Architecture

```mermaid
graph LR
    subgraph "Production"
        LB[Load Balancer]
        App1[Next.js Instance 1]
        App2[Next.js Instance 2]
        DB[(PostgreSQL)]
        KC[Keycloak]
    end
    
    subgraph "External"
        DS[DocuSeal Cloud]
    end
    
    LB --> App1
    LB --> App2
    App1 --> DB
    App2 --> DB
    App1 --> KC
    App2 --> KC
    App1 --> DS
    App2 --> DS
```

## Troubleshooting

### Common Issues

#### 1. React Hooks Error
**Symptom**: `Cannot read properties of null (reading 'useState')`  
**Cause**: React version mismatch  
**Solution**: Ensure React 18.3.1 is installed
```bash
npm install react@18.3.1 react-dom@18.3.1
```

#### 2. Submissions Not Appearing
**Symptom**: Submissions created but not in list  
**Cause**: User ID mismatch (Keycloak ID vs App ID)  
**Solution**: Session callback uses database user ID  
**Details**: See [Authentication Flow](../architecture/02-authentication-flow.md)

#### 3. Template Fetch Errors
**Symptom**: 500 error when loading templates  
**Cause**: Missing or incorrect DocuSeal API configuration  
**Solution**: Verify `DOCUSEAL_URL` and `DOCUSEAL_API_KEY`

## Monitoring & Logging

### Application Logs
- Server logs: `console.log` statements
- Error tracking: Error boundaries
- API logs: Request/response logging

### Database Logs
- Prisma query logs (development)
- Connection pool monitoring
- Migration history

### External Service Logs
- DocuSeal API responses
- Keycloak authentication events

## Scalability Considerations

### Horizontal Scaling
- Stateless Next.js instances
- Shared database
- Session storage in database
- Load balancer distribution

### Vertical Scaling
- Database optimization
- Connection pooling
- Query caching
- Resource allocation

## Technology Choices

### Why Next.js?
- Server-side rendering for SEO
- API routes for backend logic
- File-based routing
- Built-in optimization

### Why Keycloak?
- Enterprise-grade SSO
- OAuth 2.0 / OIDC standard
- Centralized user management
- Multi-application support

### Why Prisma?
- Type-safe database access
- Easy migrations
- Excellent TypeScript support
- Query optimization

### Why DocuSeal?
- E-signature capabilities
- Template management
- Email notifications
- PDF generation

## Future Enhancements

### Planned Features
- [ ] Real-time submission updates
- [ ] Advanced template filtering
- [ ] Bulk submission operations
- [ ] Analytics dashboard
- [ ] Mobile app support

### Technical Improvements
- [ ] Redis caching layer
- [ ] WebSocket for real-time updates
- [ ] GraphQL API option
- [ ] Microservices architecture
- [ ] Container orchestration (Kubernetes)
