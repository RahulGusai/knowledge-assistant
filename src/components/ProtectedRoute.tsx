import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

// Preview mode flag - bypasses authentication in preview/development
const isPreviewMode = window.location.hostname.includes('lovable.app') || 
                      window.location.hostname === 'localhost' ||
                      window.location.search.includes('preview=true');

const validateSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session validation error:', error);
      return false;
    }
    
    if (!session) {
      return false;
    }
    
    // Verify token is still valid by attempting to refresh
    const { data: { session: refreshedSession }, error: refreshError } = 
      await supabase.auth.refreshSession();
    
    if (refreshError || !refreshedSession) {
      console.error('Token refresh failed:', refreshError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Session validation failed:', error);
    return false;
  }
};

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // Skip authentication check in preview mode
    if (isPreviewMode) {
      setAuthenticated(true);
      setLoading(false);
      return;
    }

    // Validate session on component mount
    validateSession().then((isValid) => {
      setAuthenticated(isValid);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthenticated(!!session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
