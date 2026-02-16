import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from './AppContext';
import { toast } from '@/hooks/use-toast';
import { API_ENDPOINTS } from '@/constants/api';
import {
  PIPELINE_HARD_TIMEOUT_MS,
  TERMINAL_ERROR_STATUSES,
  KNOWN_HAPPY_STATUSES,
  JOB_STATUS_MESSAGES,
} from '@/constants/pipeline';

interface FileItem {
  id: string;
  filename: string;
  size_bytes: number;
  created_at: string;
  mime_type: string;
  storage_path: string;
}

export interface JobItem {
  id: string;
  workspace_id: string;
  trigger_by: string | null;
  started_at: string;
  finished_at: string | null;
  meta: any;
  created_at: string;
  pipeline_version: string | null;
  embedding_model: string | null;
  status: 'created' | 'queued' | 'validating' | 'validation_failed' | 'snapshot_created' | 
          'delta_calculated' | 'ingesting' | 'ingestion_failed' | 'embeddings_created' | 
          'completed' | 'failed' | 'cancelled' | null;
  error_message: string | null;
  total_time_taken: string | null;
  updated_at: string | null;
}

interface PipelineContextType {
  fileIds: string[];
  triggerBy: string | null;
  addFileId: (fileId: string) => void;
  clearFileIds: () => void;
  setTriggerBy: (userId: string) => void;
  files: FileItem[];
  fetchFiles: () => Promise<void>;
  jobs: JobItem[];
  fetchJobs: () => Promise<void>;
  addOrUpdateJob: (job: JobItem) => void;
  // Running state
  isRunning: boolean;
  progress: number;
  progressMessage: string;
  currentStatus: string;
  triggerPipeline: () => Promise<void>;
}

const PipelineContext = createContext<PipelineContextType | undefined>(undefined);

export const usePipeline = () => {
  const context = useContext(PipelineContext);
  if (!context) {
    throw new Error('usePipeline must be used within PipelineProvider');
  }
  return context;
};

export const PipelineProvider = ({ children }: { children: ReactNode }) => {
  const { workspaceId } = useAppContext();
  const [fileIds, setFileIds] = useState<string[]>([]);
  const [triggerBy, setTriggerBy] = useState<string | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [jobs, setJobs] = useState<JobItem[]>([]);

  // Running state (lifted from Pipeline.tsx)
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');
  const hardTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ingestIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchFiles = async () => {
    if (!workspaceId) return;
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const fetchJobs = async () => {
    if (!workspaceId) return;
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('started_at', { ascending: false });
      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchFiles();
      fetchJobs();
    }
  }, [workspaceId]);

  const addFileId = (fileId: string) => {
    setFileIds(prev => [...prev, fileId]);
  };

  const clearFileIds = () => {
    setFileIds([]);
  };

  const addOrUpdateJob = (job: JobItem) => {
    setJobs(prevJobs => {
      const existingIndex = prevJobs.findIndex(j => j.id === job.id);
      if (existingIndex >= 0) {
        const updated = [...prevJobs];
        updated[existingIndex] = job;
        return updated;
      } else {
        return [job, ...prevJobs];
      }
    });
  };

  const clearRunningState = useCallback(() => {
    setIsRunning(false);
    setProgress(0);
    setProgressMessage('');
    setCurrentStatus('');
    if (hardTimeoutRef.current) {
      clearTimeout(hardTimeoutRef.current);
      hardTimeoutRef.current = null;
    }
    if (ingestIntervalRef.current) {
      clearInterval(ingestIntervalRef.current);
      ingestIntervalRef.current = null;
    }
  }, []);

  // Realtime subscription - stays alive across navigation
  useEffect(() => {
    if (!supabase || !isRunning || !workspaceId) return;

    const channel = supabase
      .channel('job-updates-ctx')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          console.log('Job update received:', payload);
          if (payload.eventType !== 'INSERT' && payload.eventType !== 'UPDATE') return;

          const job = payload.new as any;
          if (job.workspace_id !== workspaceId) return;

          const status = job.status as string;
          const isUnknownStatus = !KNOWN_HAPPY_STATUSES.includes(status) && !TERMINAL_ERROR_STATUSES.includes(status);
          const statusInfo = JOB_STATUS_MESSAGES[status] || { message: "Unknown error occurred", progress: 0 };

          setCurrentStatus(status);
          setProgressMessage(statusInfo.message);

          // Handle ingesting phase with animated progress (60-90%)
          if (status === 'ingesting') {
            if (ingestIntervalRef.current) clearInterval(ingestIntervalRef.current);
            let currentProgress = 60;
            setProgress(60);
            ingestIntervalRef.current = setInterval(() => {
              currentProgress += 2;
              if (currentProgress <= 90) {
                setProgress(currentProgress);
              } else {
                if (ingestIntervalRef.current) clearInterval(ingestIntervalRef.current);
                ingestIntervalRef.current = null;
              }
            }, 300);
          } else {
            if (ingestIntervalRef.current) {
              clearInterval(ingestIntervalRef.current);
              ingestIntervalRef.current = null;
            }
            setProgress(statusInfo.progress);
          }

          // Terminal success
          if (status === 'completed') {
            clearRunningState();
            setProgress(100);
            setProgressMessage("Pipeline completed successfully! ✨");
            // Keep isRunning false but show final state briefly
            toast({
              title: "Pipeline completed successfully",
              description: "The pipeline ran successfully",
            });
            addOrUpdateJob(job as JobItem);
          }
          // Terminal error or unknown
          else if (TERMINAL_ERROR_STATUSES.includes(status) || isUnknownStatus) {
            clearRunningState();
            toast({
              title: status === 'cancelled' ? "Pipeline cancelled" : "Pipeline failed",
              description: statusInfo.message,
              variant: "destructive",
            });
            addOrUpdateJob(job as JobItem);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      fetchJobs();
    };
  }, [isRunning, workspaceId, clearRunningState]);

  // Trigger pipeline
  const triggerPipeline = useCallback(async () => {
    if (!workspaceId) {
      toast({ title: "Workspace not loaded", description: "Please wait for workspace to be loaded", variant: "destructive" });
      return;
    }
    if (files.length === 0) {
      toast({ title: "Cannot run pipeline", description: "Please upload files before triggering the pipeline", variant: "destructive" });
      return;
    }

    const fileIdsToSend = files.map(file => file.id);

    setIsRunning(true);
    setProgress(0);
    setProgressMessage("Initializing pipeline...");
    setCurrentStatus('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({ title: "Authentication error", description: "Please log in again", variant: "destructive" });
        setIsRunning(false);
        return;
      }

      const payload = {
        file_ids: fileIdsToSend,
        workspace_id: workspaceId,
        trigger_by: session.user.id,
      };

      setProgressMessage("Sending request to pipeline...");
      setProgress(5);

      const response = await fetch(API_ENDPOINTS.PIPELINE_TRIGGER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error("Pipeline API returned invalid response format");
      }

      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error("Pipeline API returned invalid JSON response");
      }

      if (result.success === false) {
        throw new Error(result.error || result.message || "Pipeline API returned failure status");
      }

      // Immediate success from API
      if (result.success === true) {
        clearRunningState();
        setProgress(100);
        setProgressMessage("Pipeline completed successfully! ✨");
        toast({ title: "Pipeline completed successfully", description: "The pipeline ran successfully" });
        return;
      }

      if (!result || result.error) {
        throw new Error(result?.error || "Pipeline API returned without starting job");
      }

      // Start 15-minute hard timeout
      hardTimeoutRef.current = setTimeout(() => {
        clearRunningState();
        toast({
          title: "Pipeline timeout",
          description: "Pipeline did not complete within 15 minutes and was cancelled.",
          variant: "destructive",
        });
        // TODO: Add API call to mark job as cancelled server-side
      }, PIPELINE_HARD_TIMEOUT_MS);

      setProgressMessage("Waiting for pipeline updates...");
      setProgress(10);
    } catch (error) {
      clearRunningState();
      toast({
        title: "Pipeline failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  }, [workspaceId, files, clearRunningState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hardTimeoutRef.current) clearTimeout(hardTimeoutRef.current);
      if (ingestIntervalRef.current) clearInterval(ingestIntervalRef.current);
    };
  }, []);

  return (
    <PipelineContext.Provider
      value={{
        fileIds,
        triggerBy,
        addFileId,
        clearFileIds,
        setTriggerBy,
        files,
        fetchFiles,
        jobs,
        fetchJobs,
        addOrUpdateJob,
        isRunning,
        progress,
        progressMessage,
        currentStatus,
        triggerPipeline,
      }}
    >
      {children}
    </PipelineContext.Provider>
  );
};
