// Hard timeout: if no terminal status within 15 minutes, cancel the job
export const PIPELINE_HARD_TIMEOUT_MS = 15 * 60 * 1000;

export const TERMINAL_ERROR_STATUSES = ['validation_failed', 'ingestion_failed', 'failed', 'cancelled'];
export const KNOWN_HAPPY_STATUSES = ['created', 'queued', 'validating', 'snapshot_created', 'delta_calculated', 'ingesting', 'embeddings_created', 'completed'];

// Progress mapping for pipeline statuses
export const PROGRESS_MAP: Record<string, number> = {
  created: 0,
  queued: 5,
  validating: 10,
  validation_failed: 0,
  snapshot_created: 25,
  delta_calculated: 40,
  ingesting: 60,
  ingestion_failed: 0,
  embeddings_created: 95,
  completed: 100,
  failed: 0,
  cancelled: 0,
};

// Job status to friendly message mapping
export const JOB_STATUS_MESSAGES: Record<string, { message: string; progress: number }> = {
  created: { message: "Pipeline job created and initializing...", progress: PROGRESS_MAP.created },
  queued: { message: "Pipeline is queued and waiting to start...", progress: PROGRESS_MAP.queued },
  validating: { message: "Validating files and prerequisites...", progress: PROGRESS_MAP.validating },
  validation_failed: { message: "Validation failed - please check your files", progress: 0 },
  snapshot_created: { message: "Just took a snapshot of the job to save us future troubles", progress: PROGRESS_MAP.snapshot_created },
  delta_calculated: { message: "Hang on tight... job delta created successfully!", progress: PROGRESS_MAP.delta_calculated },
  ingesting: { message: "Ingesting and processing your documents...", progress: PROGRESS_MAP.ingesting },
  ingestion_failed: { message: "Failed to ingest documents - please try again", progress: 0 },
  embeddings_created: { message: "Generated AI embeddings for semantic search", progress: PROGRESS_MAP.embeddings_created },
  completed: { message: "Pipeline completed successfully! ✨", progress: PROGRESS_MAP.completed },
  failed: { message: "Pipeline encountered an error", progress: 0 },
  cancelled: { message: "Pipeline was cancelled", progress: 0 },
};
