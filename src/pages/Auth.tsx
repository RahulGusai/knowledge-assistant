import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Apple, Chrome, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement Supabase authentication
    console.log(isSignUp ? "Sign up" : "Sign in", { email, password });
  };

  const handleGoogleAuth = async () => {
    // TODO: Implement Google OAuth with Supabase
    console.log("Sign in with Google");
  };

  const handleAppleAuth = async () => {
    // TODO: Implement Apple OAuth with Supabase
    console.log("Sign in with Apple");
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
            <Mail className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            {isSignUp ? "Create an account" : "Welcome back"}
          </CardTitle>
          <CardDescription className="text-base">
            {isSignUp
              ? "Enter your information to create your account"
              : "Sign in to access your RAG chatbot dashboard"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleEmailAuth} className="space-y-5">
            <div className="space-y-2 animate-fade-in">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 transition-all focus:ring-primary/20"
                required
              />
            </div>
            <div className="space-y-2 animate-fade-in delay-75">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 transition-all focus:ring-primary/20"
                required
              />
            </div>
            <Button type="submit" className="w-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all" size="lg">
              {isSignUp ? "Sign up with Email" : "Sign in with Email"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleGoogleAuth}
              className="w-full hover-scale border-primary/20 hover:border-primary/40 transition-all"
            >
              <Chrome className="mr-2 h-4 w-4" />
              Google
            </Button>
            <Button
              variant="outline"
              onClick={handleAppleAuth}
              className="w-full hover-scale border-primary/20 hover:border-primary/40 transition-all"
            >
              <Apple className="mr-2 h-4 w-4" />
              Apple
            </Button>
          </div>

          <div className="text-center text-sm pt-2">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:text-primary/80 font-medium transition-colors story-link"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
