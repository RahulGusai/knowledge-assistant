import { createContext, useContext, useState, ReactNode } from 'react';

interface PipelineContextType {
  fileIds: string[];
  workspaceId: string;
  triggerBy: string | null;
  addFileId: (fileId: string) => void;
  clearFileIds: () => void;
  setTriggerBy: (userId: string) => void;
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
      }}
    >
      {children}
    </PipelineContext.Provider>
  );
};
