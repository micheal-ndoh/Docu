# DocuSeal API Endpoints - Configuration Summary

All endpoints are configured to use `process.env.DOCUSEAL_URL` with fallback to `https://api.docuseal.com`.

## ✅ Configured Endpoints

### Templates
| Method | Endpoint | DocuSeal API | Status |
|--------|----------|--------------|--------|
| GET | `/api/docuseal/templates` | `${DOCUSEAL_URL}/templates` | ✅ |
| POST | `/api/docuseal/templates` | `${DOCUSEAL_URL}/templates` or `/templates/docx` | ✅ |
| GET | `/api/docuseal/templates/[id]` | `${DOCUSEAL_URL}/templates/{id}` | ✅ |
| PUT | `/api/docuseal/templates/[id]` | `${DOCUSEAL_URL}/templates/{id}` | ✅ |
| DELETE | `/api/docuseal/templates/[id]` | `${DOCUSEAL_URL}/templates/{id}` | ✅ |

### Submissions
| Method | Endpoint | DocuSeal API | Status |
|--------|----------|--------------|--------|
| GET | `/api/docuseal/submissions` | `${DOCUSEAL_URL}/submissions` | ✅ |
| POST | `/api/docuseal/submissions` | `${DOCUSEAL_URL}/submissions` | ✅ |
| GET | `/api/docuseal/submissions/[id]` | `${DOCUSEAL_URL}/submissions/{id}` | ✅ |
| DELETE | `/api/docuseal/submissions/[id]` | `${DOCUSEAL_URL}/submissions/{id}` | ✅ |
| GET | `/api/docuseal/submissions/[id]/documents` | `${DOCUSEAL_URL}/submissions/{id}/documents` | ✅ |

### Submitters
| Method | Endpoint | DocuSeal API | Status |
|--------|----------|--------------|--------|
| GET | `/api/docuseal/submitters` | `${DOCUSEAL_URL}/submitters` | ✅ |
| GET | `/api/docuseal/submitters/[id]` | `${DOCUSEAL_URL}/submitters/{id}` | ✅ |
| PUT | `/api/docuseal/submitters/[id]` | `${DOCUSEAL_URL}/submitters/{id}` | ✅ |

## Environment Configuration

Add to your `.env` file:

```env
# DocuSeal URL (self-hosted or cloud)
DOCUSEAL_URL="http://localhost:3000"  # For self-hosted
# DOCUSEAL_URL="https://api.docuseal.com"  # For cloud (or omit to use default)

# DocuSeal API Key
DOCUSEAL_API_KEY="your_api_key_here"
```

## Verification

All 7 route files are correctly configured:
- ✅ `templates/route.ts`
- ✅ `templates/[id]/route.ts`
- ✅ `submissions/route.ts`
- ✅ `submissions/[id]/route.ts`
- ✅ `submissions/[id]/documents/route.ts`
- ✅ `submitters/route.ts`
- ✅ `submitters/[id]/route.ts`

## Testing

To test the endpoints:

1. **Start self-hosted DocuSeal:**
   ```bash
   docker-compose up -d
   ```

2. **Get API key from DocuSeal:**
   - Navigate to http://localhost:3000
   - Go to Settings → API
   - Create and copy API key

3. **Update `.env`:**
   ```env
   DOCUSEAL_URL="http://localhost:3000"
   DOCUSEAL_API_KEY="your_copied_key"
   ```

4. **Restart your app:**
   ```bash
   npm run dev
   ```

5. **Test endpoints:**
   - Visit http://localhost:3000/submissions
   - Templates should load from your self-hosted instance
   - Check browser console for API calls

## Logs Verification

From your recent logs, the system is working correctly:
- ✅ Templates endpoint: `https://api.docuseal.com/templates?limit=10` (will use DOCUSEAL_URL when set)
- ✅ Submissions endpoint: Working with status filtering
- ✅ API key authentication: Working (43 characters detected)

All endpoints are properly configured and ready to use with self-hosted DocuSeal! 🚀
