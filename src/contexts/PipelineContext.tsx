import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from './AppContext';

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
        // Update existing job
        const updated = [...prevJobs];
        updated[existingIndex] = job;
        return updated;
      } else {
        // Add new job at the beginning
        return [job, ...prevJobs];
      }
    });
  };

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
      }}
    >
      {children}
    </PipelineContext.Provider>
  );
};
