import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Github, LogIn, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/home");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/home");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGithubAuth = async () => {
    if (!isSupabaseConfigured || !supabase) {
      toast({
        title: "Configuration Required",
        description: "Please configure your Supabase credentials in src/lib/supabase.ts",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/home`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during GitHub authentication.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleGuestAuth = async () => {
    if (!isSupabaseConfigured || !supabase) {
      toast({
        title: "Configuration Required",
        description: "Please configure your Supabase credentials in src/lib/supabase.ts",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInAnonymously();

      if (error) throw error;

      toast({
        title: "Welcome!",
        description: "You're signed in as a guest.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during guest sign-in.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

      {/* Floating Orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <Card className="w-full max-w-md shadow-2xl border-primary/10 backdrop-blur-sm bg-background/95 animate-scale-in relative z-10">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/50 rounded-2xl flex items-center justify-center mb-2 shadow-lg animate-fade-in">
            <LogIn className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Welcome
          </CardTitle>
          <CardDescription className="text-base">
            Sign in to access your knowledge assistant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isSupabaseConfigured && (
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <AlertDescription className="text-sm">
                <strong>Setup Required:</strong> Update Supabase credentials in{" "}
                <code className="px-1.5 py-0.5 bg-background/50 rounded">src/lib/supabase.ts</code>
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleGithubAuth}
            className="w-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
            size="lg"
            disabled={loading}
          >
            <Github className="mr-2 h-5 w-5" />
            Sign in with GitHub
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleGuestAuth}
            className="w-full border-primary/20 hover:border-primary/40 transition-all"
            size="lg"
            disabled={loading}
          >
            <UserRound className="mr-2 h-5 w-5" />
            Continue as Guest
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
