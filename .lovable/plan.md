
## Update RAG Query Base URL

### What Needs to Change
Update the `RAG_QUERY` base URL in `src/constants/api.ts` from the current Cloud Run service to the new Railway-hosted service.

### Current Configuration
- **Base URL**: `https://rag-query-180483052401.us-east1.run.app`
- **Full Endpoint**: `https://rag-query-180483052401.us-east1.run.app/query`

### New Configuration
- **Base URL**: `https://rag-querying-service-production-f5dc.up.railway.app`
- **Full Endpoint**: `https://rag-querying-service-production-f5dc.up.railway.app/query`

### Implementation Steps
1. Update line 4 in `src/constants/api.ts`: Change `RAG_QUERY` base URL to the new Railway endpoint
2. The `RAG_QUERY` endpoint (line 9) will automatically resolve to the new full URL due to template literal interpolation
3. This change will affect the `ChatAssistant` component which calls `API_ENDPOINTS.RAG_QUERY`

### Files to Modify
- `src/constants/api.ts` (1 line change)

### Result
All subsequent API calls from the chat assistant to `API_ENDPOINTS.RAG_QUERY` will use the new Railway service URL.
