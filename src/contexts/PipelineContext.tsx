import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface FileItem {
  id: string;
  filename: string;
  size_bytes: number;
  created_at: string;
  mime_type: string;
  storage_path: string;
}

interface PipelineContextType {
  fileIds: string[];
  workspaceId: string;
  triggerBy: string | null;
  addFileId: (fileId: string) => void;
  clearFileIds: () => void;
  setTriggerBy: (userId: string) => void;
  files: FileItem[];
  fetchFiles: () => Promise<void>;
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
  const [fileIds, setFileIds] = useState<string[]>([]);
  const [workspaceId] = useState<string>('37926ce6-9757-4667-bf16-b438d6bc95b1');
  const [triggerBy, setTriggerBy] = useState<string | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);

  const fetchFiles = async () => {
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

  useEffect(() => {
    fetchFiles();
  }, []);

  const addFileId = (fileId: string) => {
    setFileIds(prev => [...prev, fileId]);
  };

  const clearFileIds = () => {
    setFileIds([]);
  };

  return (
    <PipelineContext.Provider
      value={{
        fileIds,
        workspaceId,
        triggerBy,
        addFileId,
        clearFileIds,
        setTriggerBy,
        files,
        fetchFiles,
      }}
    >
      {children}
    </PipelineContext.Provider>
  );
};
