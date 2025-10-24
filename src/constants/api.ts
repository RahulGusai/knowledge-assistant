// API Base URLs and Endpoints
export const API_BASE_URLS = {
  PIPELINE: 'https://knowledge-assistant.app.n8n.cloud',
  RAG_QUERY: 'https://rag-query-180483052401.us-east1.run.app',
} as const;

export const API_ENDPOINTS = {
  PIPELINE_TRIGGER: `${API_BASE_URLS.PIPELINE}/webhook-test/trigger-pipeline`,
  RAG_QUERY: `${API_BASE_URLS.RAG_QUERY}/query`,
} as const;
