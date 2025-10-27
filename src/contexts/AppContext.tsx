import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { WORKSPACE_ID } from '@/constants/storage';

interface AppContextType {
  workspaceId: string | null;
  userId: string | null;
  loadingWorkspace: boolean;
  workspaceError: string | null;
  loadWorkspaceId: () => Promise<void>;
  clearWorkspace: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadWorkspaceId = async () => {
    // Prevent duplicate calls
    if (isLoading) {
      console.log('Workspace already loading, skipping duplicate call');
      return;
    }

    try {
      setIsLoading(true);
      setLoadingWorkspace(true);
      setWorkspaceError(null);

      // Check localStorage first
      const cachedWorkspaceId = localStorage.getItem(WORKSPACE_ID);
      if (cachedWorkspaceId) {
        console.log('Using cached workspace ID:', cachedWorkspaceId);
        setWorkspaceId(cachedWorkspaceId);
        setLoadingWorkspace(false);
        setIsLoading(false);
        return;
      }

      // Fetch from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log('No session found when loading workspace');
        setLoadingWorkspace(false);
        setIsLoading(false);
        return;
      }

      console.log('Fetching workspace for user_id:', session.user.id);
      setUserId(session.user.id);

      const { data, error } = await supabase
        .from('workspace_users')
        .select('workspace_id')
        .eq('user_id', session.user.id)
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching workspace_id:', error);
        setWorkspaceError('Failed to load workspace');
        setLoadingWorkspace(false);
        setIsLoading(false);
        return;
      }

      if (data?.workspace_id) {
        console.log('Workspace ID loaded from Supabase:', data.workspace_id);
        setWorkspaceId(data.workspace_id);
        // Store in localStorage for future use
        localStorage.setItem(WORKSPACE_ID, data.workspace_id);
      } else {
        console.warn('No workspace found for user');
        setWorkspaceError('No workspace found');
      }
    } catch (error) {
      console.error('Error in loadWorkspaceId:', error);
      setWorkspaceError('Failed to load workspace');
    } finally {
      setLoadingWorkspace(false);
      setIsLoading(false);
    }
  };

  const clearWorkspace = () => {
    setWorkspaceId(null);
    setUserId(null);
    localStorage.removeItem(WORKSPACE_ID);
    setWorkspaceError(null);
  };

  // Initialize workspace on mount and listen for auth changes
  useEffect(() => {
    const initWorkspace = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadWorkspaceId();
      } else {
        setLoadingWorkspace(false);
      }
    };

    initWorkspace();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user && !workspaceId) {
        // Only load if we don't have a workspace yet
        setTimeout(() => {
          loadWorkspaceId();
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        clearWorkspace();
        setLoadingWorkspace(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [workspaceId]);

  return (
    <AppContext.Provider
      value={{
        workspaceId,
        userId,
        loadingWorkspace,
        workspaceError,
        loadWorkspaceId,
        clearWorkspace,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
