#!/bin/bash
set -e

echo "========================================="
echo "Starting GIS-DocuSign Deployment"
echo "========================================="

# Get AWS region and account
AWS_REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region)
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URL="$${AWS_ACCOUNT_ID}.dkr.ecr.$${AWS_REGION}.amazonaws.com"

# Update system
echo "Updating system packages..."
yum update -y

# Install Docker, Git, jq
echo "Installing Docker, Git, and jq..."
yum install -y docker git jq curl
systemctl start docker
systemctl enable docker
usermod -aG docker ec2-user

# Install AWS CLI v2
echo "Installing AWS CLI v2..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip -q awscliv2.zip
./aws/install
rm -rf aws awscliv2.zip

# Install Docker Compose
echo "Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# Verify installations
docker --version
docker-compose --version
aws --version

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URL

# Create application directory
echo "Creating application directory..."
mkdir -p /home/ec2-user/gis-docusign
cd /home/ec2-user/gis-docusign

# Create Keycloak realm import script
echo "Creating Keycloak realm import script..."
mkdir -p scripts realms
cat > scripts/import-realm.sh <<'IMPORT_SCRIPT'
#!/bin/bash
set -e

KEYCLOAK_HOST=$${KEYCLOAK_HOST:-keycloak:8080}
KEYCLOAK_ADMIN_PASSWORD=$${KEYCLOAK_ADMIN_PASSWORD:-admin}

echo "Waiting for Keycloak at $KEYCLOAK_HOST to be ready..."
i=1
while [ $i -le 60 ]; do
  if curl -s "http://$${KEYCLOAK_HOST}/realms/master" > /dev/null 2>&1; then
    echo "Keycloak is ready!"
    break
  fi
  echo "Attempt $i/60 - Keycloak not ready yet, waiting..."
  i=$((i + 1))
  sleep 2
done

echo "Getting admin access token..."
TOKEN=$(curl -s -X POST "http://$${KEYCLOAK_HOST}/realms/master/protocol/openid-connect/token" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=password' \
  -d 'client_id=admin-cli' \
  -d 'username=admin' \
  -d "password=$KEYCLOAK_ADMIN_PASSWORD" | jq -r '.access_token')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "Failed to get admin token"
  exit 1
fi

echo "Got admin token, importing realm..."
REALM_FILE="/realms/gis-realm.json"
if [ ! -f "$REALM_FILE" ]; then
  echo "Realm file not found at $REALM_FILE"
  exit 1
fi

curl -s -X POST "http://$${KEYCLOAK_HOST}/admin/realms" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d @"$REALM_FILE"

echo "Realm import completed successfully!"
IMPORT_SCRIPT

chmod +x scripts/import-realm.sh

# Create Keycloak realm configuration
echo "Creating Keycloak realm configuration..."
cat > realms/gis-realm.json <<'REALM_JSON'
{
  "realm": "gis",
  "displayName": "GIS-DocuSign Realm",
  "enabled": true,
  "sslRequired": "none",
  "registrationAllowed": true,
  "loginWithEmailAllowed": true,
  "duplicateEmailsAllowed": false,
  "resetPasswordAllowed": true,
  "editUsernameAllowed": false,
  "bruteForceProtected": true,
  "clients": [
    {
      "clientId": "gis-docusign-client",
      "name": "GIS-DocuSign Next.js App",
      "enabled": true,
      "publicClient": false,
      "protocol": "openid-connect",
      "clientAuthenticatorType": "client-secret",
      "secret": "${keycloak_client_secret}",
      "redirectUris": [
        "http://localhost:3000/api/auth/callback/keycloak",
        "http://localhost:3000/*",
        "*"
      ],
      "webOrigins": ["*"],
      "directAccessGrantsEnabled": true,
      "standardFlowEnabled": true,
      "implicitFlowEnabled": false,
      "serviceAccountsEnabled": false,
      "attributes": {
        "post.logout.redirect.uris": "+"
      }
    }
  ],
  "roles": {
    "realm": [
      { "name": "user" },
      { "name": "admin" }
    ]
  }
}
REALM_JSON

# Create docker-compose.yml
echo "Creating docker-compose.yml..."
cat > docker-compose.yml <<COMPOSE_EOF
services:
  nextjs-app:
    image: $${ECR_URL}/gis-docusign/nextjs:latest
    container_name: gis-nextjs-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:${nextjs_db_password}@postgres-nextjs:5432/nextjs_db
      - DIRECT_DATABASE_URL=postgresql://postgres:${nextjs_db_password}@postgres-nextjs:5432/nextjs_db
      - KEYCLOAK_ID=${keycloak_id}
      - KEYCLOAK_SECRET=${keycloak_secret}
      - KEYCLOAK_ISSUER=${keycloak_issuer}
      - NEXTAUTH_URL=${nextauth_url}
      - NEXTAUTH_SECRET=${nextauth_secret}
      - DOCUSEAL_URL=http://docuseal:3000
      - DOCUSEAL_API_KEY=${docuseal_api_key}
    depends_on:
      postgres-nextjs:
        condition: service_healthy
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  postgres-nextjs:
    image: postgres:15
    container_name: gis-postgres-nextjs
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${nextjs_db_password}
      POSTGRES_DB: nextjs_db
    ports:
      - "5433:5432"
    volumes:
      - postgres_nextjs_data:/var/lib/postgresql/data
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  postgres-keycloak:
    image: postgres:15
    container_name: gis-postgres-keycloak
    restart: unless-stopped
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${keycloak_db_password}
    ports:
      - "5434:5432"
    volumes:
      - postgres_keycloak_data:/var/lib/postgresql/data
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  keycloak:
    image: quay.io/keycloak/keycloak:23.0
    container_name: gis-keycloak
    restart: unless-stopped
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres-keycloak:5432/keycloak
      KC_DB_USERNAME: postgres
      KC_DB_PASSWORD: ${keycloak_admin_password}
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: ${keycloak_admin_password}
      KC_HOSTNAME_STRICT: false
      KC_HTTP_ENABLED: true
      KC_PROXY: edge
    ports:
      - "8080:8080"
    depends_on:
      postgres-keycloak:
        condition: service_healthy
    networks:
      - app-network
    command: start-dev
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  keycloak-init:
    image: alpine:3.18
    container_name: gis-keycloak-init
    depends_on:
      keycloak:
        condition: service_healthy
    networks:
      - app-network
    volumes:
      - ./scripts/import-realm.sh:/import-realm.sh:ro
      - ./realms/gis-realm.json:/realms/gis-realm.json:ro
    environment:
      - KEYCLOAK_HOST=keycloak:8080
      - KEYCLOAK_ADMIN_PASSWORD=${keycloak_admin_password}
    entrypoint: /bin/sh
    command: -c "apk add --no-cache curl jq && sh /import-realm.sh"

  postgres-docuseal:
    image: postgres:15
    container_name: gis-postgres-docuseal
    restart: unless-stopped
    environment:
      POSTGRES_DB: docuseal
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${docuseal_db_password}
    ports:
      - "5435:5432"
    volumes:
      - postgres_docuseal_data:/var/lib/postgresql/data
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  docuseal:
    image: docuseal/docuseal:latest
    container_name: gis-docuseal
    restart: unless-stopped
    ports:
      - "8081:3000"
    volumes:
      - docuseal_data:/data/docuseal
    environment:
      DATABASE_URL: postgresql://postgres:${docuseal_db_password}@postgres-docuseal:5432/docuseal
      FORCE_SSL: "false"
    depends_on:
      postgres-docuseal:
        condition: service_healthy
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

volumes:
  postgres_nextjs_data:
  postgres_keycloak_data:
  postgres_docuseal_data:
  docuseal_data:

networks:
  app-network:
    driver: bridge
COMPOSE_EOF

# Create .env file with secrets
echo "Creating .env file..."
cat > .env <<ENV_EOF
nextjs_db_password=${nextjs_db_password}
keycloak_db_password=${keycloak_db_password}
docuseal_db_password=${docuseal_db_password}
keycloak_admin_password=${keycloak_admin_password}
nextauth_secret=${nextauth_secret}
nextauth_url=${nextauth_url}
keycloak_id=${keycloak_id}
keycloak_secret=${keycloak_secret}
keycloak_issuer=${keycloak_issuer}
docuseal_api_key=${docuseal_api_key}
ENV_EOF

# Set permissions
chown -R ec2-user:ec2-user /home/ec2-user/gis-docusign
chmod 600 .env

# Pull images from ECR
echo "Pulling NextJS image from ECR..."
docker pull $${ECR_URL}/gis-docusign/nextjs:latest || echo "Warning: Could not pull NextJS image from ECR. Will need to build and push first."

# Start containers
echo "Starting Docker containers..."
docker-compose up -d

# Wait for containers to be healthy
echo "Waiting for containers to be healthy..."
sleep 60

# Check container status
echo "Container status:"
docker-compose ps

# Setup log rotation
echo "Setting up log rotation..."
cat > /etc/logrotate.d/docker-containers <<LOGROTATE_EOF
/var/lib/docker/containers/*/*.log {
  rotate 7
  daily
  compress
  size=10M
  missingok
  delaycompress
  copytruncate
}
LOGROTATE_EOF

# Create deployment info file
cat > /home/ec2-user/deployment-info.txt <<INFO_EOF
========================================
GIS-DocuSign Deployment Information
========================================

Deployment Time: $(date)

Services:
- NextJS:   http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000
- Keycloak: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8080
- DocuSeal: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8081

ECR Repository: $${ECR_URL}/gis-docusign/nextjs

Useful Commands:
- Check containers: docker-compose ps
- View logs: docker-compose logs -f
- Restart services: docker-compose restart
- Stop services: docker-compose down
- Start services: docker-compose up -d
- Pull latest image: docker-compose pull nextjs-app && docker-compose up -d nextjs-app

Data Locations:
- Docker volumes: /var/lib/docker/volumes/
- Application: /home/ec2-user/gis-docusign/

Keycloak:
- Admin Console: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8080/admin
- Username: admin
- Password: (check .env file)
- Realm: gis (auto-imported)
- Client ID: gis-docusign-client

DocuSeal:
- Get API key from Settings after first login

========================================
INFO_EOF

chown ec2-user:ec2-user /home/ec2-user/deployment-info.txt

echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo "Check /home/ec2-user/deployment-info.txt for service URLs"
echo "Keycloak realm 'gis' has been automatically imported!"
