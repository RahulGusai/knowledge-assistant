import { ReactNode } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface WorkspaceLoaderProps {
  children: ReactNode;
}

export default function WorkspaceLoader({ children }: WorkspaceLoaderProps) {
  const { workspaceId, loadingWorkspace, workspaceError, loadWorkspaceId, clearWorkspace } = useAppContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearWorkspace();
    navigate('/auth');
  };

  const handleRetry = () => {
    loadWorkspaceId();
  };

  // Show loader while workspace is being fetched
  if (loadingWorkspace) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // Show error if workspace failed to load
  if (workspaceError || !workspaceId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Workspace Error</CardTitle>
            </div>
            <CardDescription>
              {workspaceError || 'No workspace found for your account'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We couldn't load your workspace. This might be because:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Your account is not associated with any workspace</li>
              <li>There was a temporary connection issue</li>
              <li>The workspace data is not properly configured</li>
            </ul>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleRetry} variant="default" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button onClick={handleLogout} variant="outline" className="flex-1">
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Workspace loaded successfully, render children
  return <>{children}</>;
}
