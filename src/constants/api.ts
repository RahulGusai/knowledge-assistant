// API Base URLs and Endpoints
export const API_BASE_URLS = {
  PIPELINE: "https://ai-workflows-n8n.up.railway.app",
  RAG_QUERY: "https://rag-querying-service-production-f5dc.up.railway.app",
} as const;

export const API_ENDPOINTS = {
  PIPELINE_TRIGGER: `${API_BASE_URLS.PIPELINE}/webhook/trigger-pipeline`,
  RAG_QUERY: `${API_BASE_URLS.RAG_QUERY}/query`,
} as const;
