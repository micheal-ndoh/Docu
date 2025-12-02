Keycloak realm for GIS Docusign

Import instructions:

- Open Keycloak Admin Console.
- Click "Add realm" -> "Import" and select `docuseal-realm.json`.
- After import, open the client `docuseal-next` and go to "Credentials" to copy the generated client secret (or set one). Replace the `secret` field in the JSON if you prefer to manage it in source control (not recommended for production).
- Update `Redirect URIs` and `Web Origins` to match your deployment (for production, replace `http://localhost:3000` with your domain).

Environment variables for Next.js (set in your `.env` or container env):

- `KEYCLOAK_ID=docuseal-next`
- `KEYCLOAK_SECRET=<client-secret>`
- `KEYCLOAK_ISSUER=https://<keycloak-host>/realms/docuseal`

Notes:
- The test user `test@docuseal.local` is included with password `Test1234!`. Delete or change this user before deploying to production.
- The realm file contains a placeholder `secret` value `REPLACE_WITH_CLIENT_SECRET`. It's safer to set the secret in Keycloak after import and use environment variables in your app.
- If import fails, check the JSON for proper Keycloak export shape (roles must be an array of objects under `roles.realm`).
