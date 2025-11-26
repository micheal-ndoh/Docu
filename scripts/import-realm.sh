#!/bin/bash
set -e

# Wait for Keycloak to be ready
echo "Waiting for Keycloak to be ready..."
for i in {1..30}; do
  if curl -s http://localhost:8080/realms/master > /dev/null 2>&1; then
    echo "Keycloak is ready!"
    break
  fi
  echo "Attempt $i/30 - Keycloak not ready yet, waiting..."
  sleep 2
done

# Get admin access token
echo "Getting admin access token..."
TOKEN=$(curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=password' \
  -d 'client_id=admin-cli' \
  -d 'username=admin' \
  -d 'password=admin' | jq -r '.access_token')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "Failed to get admin token"
  exit 1
fi

echo "Got admin token, importing realm..."

# Import the realm
REALM_FILE="${1:-/realms/docuseal-realm.json}"
if [ ! -f "$REALM_FILE" ]; then
  echo "Realm file not found at $REALM_FILE"
  exit 1
fi

curl -s -X POST http://localhost:8080/admin/realms \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d @"$REALM_FILE" | jq '.'

echo "Realm import completed successfully!"
