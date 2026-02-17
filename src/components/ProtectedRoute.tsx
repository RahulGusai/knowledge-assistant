import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAppContext } from "@/contexts/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Allow unrestricted access in preview mode
  const isPreview = window.location.hostname.includes('preview--') || window.location.hostname === 'localhost';
  
  const [isLoading, setIsLoading] = useState(!isPreview);
  const [isAuthenticated, setIsAuthenticated] = useState(isPreview);
  const { workspaceId, workspaceError, loadWorkspaceId, clearWorkspace } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthAndLoadWorkspace = async () => {
      if (isPreview) return;
      if (!supabase) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      // Step 1: Check authentication FIRST
      const { data } = await supabase.auth.getSession();
      
      if (!data.session) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      // Step 2: User is authenticated, now load workspace
      setIsAuthenticated(true);
      
      // Step 3: Load workspace (only after auth confirmed)
      await loadWorkspaceId();
      
      setIsLoading(false);
    };

    checkAuthAndLoadWorkspace();

    // Listen for auth state changes
    if (supabase) {
      const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          clearWorkspace();
        } else if (session) {
          setIsAuthenticated(true);
        }
      });

      return () => listener.subscription.unsubscribe();
    }
  }, []);

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    clearWorkspace();
    navigate('/auth');
  };

  const handleRetry = () => {
    setIsLoading(true);
    loadWorkspaceId().finally(() => setIsLoading(false));
  };

  // Show unified loading state for both auth check and workspace loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">
            {isAuthenticated ? 'Loading workspace...' : 'Checking authentication...'}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Show error if workspace failed to load (after auth succeeded)
  if (!isPreview && (workspaceError || !workspaceId)) {
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

  // Auth and workspace both successful, render children
  return <>{children}</>;
}
