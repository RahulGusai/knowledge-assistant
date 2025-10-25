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
  workspaceId: string | null;
  triggerBy: string | null;
  addFileId: (fileId: string) => void;
  clearFileIds: () => void;
  setTriggerBy: (userId: string) => void;
  files: FileItem[];
  fetchFiles: () => Promise<void>;
  loadWorkspaceId: () => Promise<void>;
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
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [triggerBy, setTriggerBy] = useState<string | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);

  const loadWorkspaceId = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log('No session found when loading workspace');
        return;
      }

      console.log('Fetching workspace for user_id:', session.user.id);

      const { data, error } = await supabase
        .from('workspace_users')
        .select('workspace_id')
        .eq('user_id', session.user.id)
        .limit(1);

      console.log('Workspace query response:', { data, error });

      if (error) {
        console.error('Error fetching workspace_id:', error);
        return;
      }
      
      if (data && data.length > 0 && data[0]?.workspace_id) {
        console.log('Setting workspace_id:', data[0].workspace_id);
        setWorkspaceId(data[0].workspace_id);
        console.log('Workspace ID loaded successfully:', data[0].workspace_id);
      } else {
        console.warn('No workspace found for user');
      }
    } catch (error) {
      console.error('Error in loadWorkspaceId:', error);
    }
  };

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

  useEffect(() => {
    if (workspaceId) {
      fetchFiles();
    }
  }, [workspaceId]);

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
        loadWorkspaceId,
      }}
    >
      {children}
    </PipelineContext.Provider>
  );
};
