# Project Setup Guide

This guide will help you set up the Docuseal project for local development using Docker.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ (if running without Docker)
- Git

## Architecture Overview

The project consists of two main applications:

1. **Next.js App** (Custom Docuseal Frontend) - Port 3000
2. **Docuseal OSS** (Official Docuseal Service) - Port 3001
3. **PostgreSQL for Next.js** - Port 5433
4. **PostgreSQL for Docuseal** - Port 5432

## Local Development Setup

### 1. Clone and Navigate to Project

```bash
cd apps/Docuseal
```

### 2. Environment Configuration

Create a `.env` file in the project root (copy from `.env.example` if available):

```env
# Database Configuration (for Next.js app)

# For Prisma Client (inside the container)
DATABASE_URL="postgresql://postgres:postgres@postgres-nextjs:5432/nextjs_db?schema=public"

# For Prisma Migrate/CLI (from your local machine)
DIRECT_DATABASE_URL="postgresql://postgres:postgres@localhost:5433/nextjs_db?schema=public"

# Docuseal API Configuration
DOCUSEAL_URL="http://localhost:3001"
DOCUSEAL_API_KEY="your_api_key_here"

# Other environment variables
NODE_ENV=development
```

**Important**: Notice the two different database URLs:
- `DATABASE_URL` uses the service name `postgres-nextjs` and the internal Docker port `5432`. This is for the Next.js app to connect to the database from within the container.
- `DIRECT_DATABASE_URL` uses `localhost` and the mapped port `5433`. This is for running Prisma commands like `migrate` or `studio` from your local machine.

### 3. Start All Services with Docker

**Start all services:**
```bash
docker-compose up
```

**Start in detached mode (background):**
```bash
docker-compose up -d
```

**Start only specific services:**
```bash
# Only Next.js app
docker-compose up nextjs-app

# Only Docuseal OSS + Database
docker-compose up app postgres
```

### 4. Access Applications

- **Next.js App**: http://localhost:3000
- **Docuseal OSS**: http://localhost:3001

### 5. Configure Docuseal API (First Time Setup)

1. Navigate to http://localhost:3001
2. Create an admin account on first launch
3. Go to **Settings → API**
4. Create a new API key
5. Copy the generated key and add it to your `.env` file:
   ```env
   DOCUSEAL_API_KEY="your_generated_api_key"
   ```
6. Restart the Next.js app:
   ```bash
   docker-compose restart nextjs-app
   ```

## Common Commands

### Docker Commands

**Stop all services:**
```bash
docker-compose down
```

**Rebuild containers (after dependency changes):**
```bash
docker-compose up --build
```

**View logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f nextjs-app
docker-compose logs -f app
```

**Remove all containers and volumes:**
```bash
docker-compose down -v
```

### Database Commands

**Database Migrations:**
Migrations are applied automatically every time the `nextjs-app` container starts. You will see the migration status in the Docker logs.

If you need to create a *new* migration after modifying the `schema.prisma` file, you can run the following command:
```bash
docker-compose exec nextjs-app npx prisma migrate dev --name your-migration-name
```
This will generate a new migration file, which will then be applied automatically the next time you start the container.

**Generate Prisma client:**
```bash
docker-compose exec nextjs-app npx prisma generate
```

**Open Prisma Studio:**
```bash
docker-compose exec nextjs-app npx prisma studio
```

## Development Workflow

### Hot Reload

The Next.js app is configured with volume mounts for hot reload. Any changes to your code will automatically reflect in the running container.

### Installing New Dependencies

**Option 1: Rebuild container**
```bash
# Add dependency to package.json
docker-compose up --build nextjs-app
```

**Option 2: Install inside container**
```bash
docker-compose exec nextjs-app npm install <package-name>
```

## Production Setup (Optional)

### Running with Custom Domain and SSL

The project includes Caddy for automatic SSL certificate management. To run with a custom domain:

**Start with SSL enabled:**
```bash
sudo HOST=your-domain.com docker-compose up
```

This will:
- Start all services with Caddy reverse proxy
- Automatically obtain SSL certificates via Let's Encrypt
- Serve applications over HTTPS

**Access applications:**
- **Next.js App**: https://your-domain.com (via Caddy)
- **Docuseal OSS**: http://localhost:3001 (direct access)

**Note:** For production deployment, ensure:
- Your domain DNS points to your server IP
- Ports 80 and 443 are open in your firewall
- You have proper environment variables configured

## Troubleshooting

### Port Already in Use

If ports 3000 or 3001 are already in use:
```bash
# Find process using the port
lsof -i :3000
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### Database Connection Issues

- Ensure your `.env` file has the correct `DATABASE_URL`
- Check if your database is running and accessible
- Verify database credentials

### Container Build Fails

```bash
# Clean up Docker cache
docker-compose down
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up
```

### Permission Issues

If you encounter permission issues with volumes:
```bash
# Fix ownership (Linux/Mac)
sudo chown -R $USER:$USER .
```

## Project Structure

```
apps/Docuseal/
├── src/                    # Next.js application source
├── prisma/                 # Database schema and migrations
├── public/                 # Static assets
├── docker-compose.yml      # Docker services configuration
├── Dockerfile.dev          # Development Dockerfile
├── .dockerignore          # Files to exclude from Docker build
├── .env                   # Environment variables (not in git)
└── package.json           # Node.js dependencies
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Docuseal Official Docs](https://www.docuseal.com/docs)
- [Docuseal GitHub Repository](https://github.com/docusealco/docuseal)
- [Docuseal API Reference](https://www.docuseal.com/docs/api)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Prisma Documentation](https://www.prisma.io/docs)
