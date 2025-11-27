# Docu-Keycloak Project Documentation

## Overview

This is a comprehensive documentation for the Docu-Keycloak project - a Next.js application that integrates Keycloak authentication with DocuSeal document signing services.

## Documentation Structure

### 📁 Architecture
- [System Overview](./architecture/01-system-overview.md) - High-level architecture and components
- [Authentication Flow](./architecture/02-authentication-flow.md) - Keycloak integration and user management
- [Database Design](./architecture/03-database-design.md) - Database schema and relationships

### 📁 Flows
- [User Authentication](./flows/01-user-authentication.md) - Login and session management
- [Submission Creation](./flows/02-submission-creation.md) - Creating and managing document submissions
- [Template Management](./flows/03-template-management.md) - Template fetching and usage

### 📁 API
- [API Routes Overview](./api/01-api-overview.md) - All API endpoints
- [DocuSeal Integration](./api/02-docuseal-integration.md) - DocuSeal API integration details
- [Authentication Middleware](./api/03-authentication.md) - Auth middleware and session handling

### 📁 Database
- [Schema Documentation](./database/01-schema.md) - Prisma schema explained
- [User Management](./database/02-user-management.md) - User creation and synchronization
- [Submissions](./database/03-submissions.md) - Submission data model

## Quick Start

1. **Environment Setup**: See [Environment Variables](./architecture/01-system-overview.md#environment-variables)
2. **Database**: See [Database Setup](./database/01-schema.md#setup)
3. **Authentication**: See [Keycloak Configuration](./architecture/02-authentication-flow.md#configuration)

## Key Technologies

- **Frontend**: Next.js 14, React 18, TypeScript
- **Authentication**: Keycloak, NextAuth.js
- **Database**: PostgreSQL, Prisma ORM
- **Document Signing**: DocuSeal API
- **UI**: Tailwind CSS, Radix UI, Shadcn/ui

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/         # NextAuth routes
│   │   └── docuseal/     # DocuSeal integration
│   ├── submissions/      # Submissions page
│   └── templates/        # Templates page
├── components/            # React components
│   ├── landing/          # Landing page components
│   └── ui/               # Reusable UI components
├── lib/                   # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   └── utils.ts          # Helper functions
├── types/                 # TypeScript type definitions
│   └── docuseal.d.ts     # DocuSeal types
└── db.ts                  # Prisma client
```

## Important Concepts

### User Identity Management

The application uses **two separate user IDs**:
- **Keycloak ID**: Used for authentication (UUID format)
- **App User ID**: Used for database relationships (CUID format)

These are linked via the user's email address. See [Authentication Flow](./architecture/02-authentication-flow.md) for details.

### DocuSeal Integration

The application acts as a proxy to the DocuSeal API:
- Templates are managed in DocuSeal by admins
- All authenticated users can access all templates
- Submissions are created via DocuSeal API and tracked locally

See [DocuSeal Integration](./api/02-docuseal-integration.md) for details.

## Common Issues & Solutions

### Submissions Not Appearing
**Issue**: Foreign key constraint violation  
**Solution**: Ensure session uses database user ID, not Keycloak ID  
**Details**: See [User Management](./database/02-user-management.md#user-id-mismatch)

### React Hooks Error
**Issue**: Version mismatch between React 18 and React 19  
**Solution**: Pin React to 18.3.1 in package.json  
**Details**: See [Troubleshooting](./architecture/01-system-overview.md#troubleshooting)

## Contributing

When making changes:
1. Update relevant documentation
2. Test authentication flow
3. Verify database migrations
4. Check API integration

## Support

For questions or issues, refer to the specific documentation sections above.
