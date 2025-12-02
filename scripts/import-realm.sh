#!/bin/bash
set -e

# KEYCLOAK_HOST may be set by the caller, default to 'keycloak:8080'
KEYCLOAK_HOST=${KEYCLOAK_HOST:-keycloak:8080}

# Wait for Keycloak to be ready
echo "Waiting for Keycloak at $KEYCLOAK_HOST to be ready..."
i=1
while [ $i -le 60 ]; do
  if curl -s "http://${KEYCLOAK_HOST}/realms/master" > /dev/null 2>&1; then
    echo "Keycloak is ready!"
    break
  fi
  echo "Attempt $i/60 - Keycloak not ready yet, waiting..."
  i=$((i + 1))
  sleep 2
done

# Get admin access token
echo "Getting admin access token from $KEYCLOAK_HOST..."
TOKEN=$(curl -s -X POST "http://${KEYCLOAK_HOST}/realms/master/protocol/openid-connect/token" \
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

curl -s -X POST "http://${KEYCLOAK_HOST}/admin/realms" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d @"$REALM_FILE" | jq '.'

echo "Realm import completed successfully!"
