[![Netlify Status](https://api.netlify.com/api/v1/badges/01e2adcd-1521-4b1d-99af-3a734a8743d5/deploy-status)](https://app.netlify.com/projects/docusea12/deploys)

# GIS Docusign

GIS Docusign is a robust application designed for secure document management, electronic signatures, and streamlined workflow automation. It allows users to upload, prepare, and send documents for signing, track submission statuses, and manage submitters efficiently.

## Production Links
- Netlify: https://docusea12.netlify.app/
- Vercel: https://docu-5qw4.vercel.app/

## Running locally (Docker Compose)

This repository includes a `docker-compose.yml` that runs the Next.js app, Keycloak, and GIS Docusign services for local development.

1. Start the stack:

```bash
# Start everything in the background
docker compose up -d

# (Recreate a single service if you changed envs)
docker compose up -d --build nextjs-app
```

2. Watch logs (optional):

```bash
docker compose logs -f nextjs-app keycloak docu-docuseal
```

3. Stop and remove containers (and optionally volumes):

```bash
# Stop containers
docker compose down

# Stop and remove volumes (resets DBs)
docker compose down -v
```

## Accessing the services

- Next.js (app under development): http://localhost:3000
- Keycloak (identity provider): http://localhost:8080 (admin console)
- GIS Docusign (self-hosted service): http://localhost:8081

Notes:
- The Keycloak realm `docuseal` and a client `docuseal-next` are auto-imported on stack startup by the `keycloak-init` job. If you change the realm file, remove Keycloak volumes and recreate the stack:

```bash
docker compose down -v
docker compose up -d
```

- For local browser redirects Keycloak uses the hostname `keycloak`. If your browser cannot resolve that, add an `/etc/hosts` entry:

```bash
sudo -- sh -c 'printf "127.0.0.1\tkeycloak\n" >> /etc/hosts'
```

- Client secret and other sensitive values should be set via `.env` and not committed to source.

**Environment variables**

- **`DOCUSEAL_API_KEY`**: API key for your self-hosted GIS Docusign instance. Set this in your local `.env` (see `.env.example`) and do NOT commit it to the repository.
- **`DOCUSEAL_URL`**: Base URL for your GIS Docusign service. In the Docker Compose setup the service is reachable at `http://docuseal:3000` from other containers; for browser access use `http://localhost:8081`.
- **`KEYCLOAK_ISSUER`**: URL of your Keycloak realm (example: `http://keycloak:8080/realms/docuseal`).

After adding or changing values in `.env` you must restart the Next.js process so it picks up the updated environment variables. Example (using Docker Compose):

```bash
# restart only Next.js service
 docker compose up -d nextjs-app 
```

```bash
# or rebuild and recreate (if you changed build-time behavior)
docker compose up -d --build nextjs-app
```

Security reminder: keep API keys and secrets in environment variables or a secret manager; never commit them into the repository.
