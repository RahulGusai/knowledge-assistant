import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUp, Puzzle, Palette, Play, LogOut, MessageSquare, LayoutDashboard } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import ChatAssistant from "@/components/ChatAssistant";
import { cn } from "@/lib/utils";

const quickLinks = [
  {
    title: "Upload Files",
    description: "Upload and manage your files",
    icon: FileUp,
    href: "/files",
    color: "text-primary"
  },
  {
    title: "Integrations",
    description: "Connect your tools and services",
    icon: Puzzle,
    href: "/integrations",
    color: "text-accent"
  },
  {
    title: "Branding",
    description: "Customize your brand identity",
    icon: Palette,
    href: "/branding",
    color: "text-success"
  },
  {
    title: "Pipeline",
    description: "Trigger and monitor pipelines",
    icon: Play,
    href: "/pipeline",
    color: "text-primary"
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/auth");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold mb-2">Welcome back</h1>
          <p className="text-muted-foreground text-lg">
            Manage your workspace and workflows
          </p>
        </div>
        <Button onClick={handleLogout} variant="outline" className="gap-2">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Talk to Assistant
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickLinks.map((link) => (
              <Link key={link.href} to={link.href}>
                <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary/20">
                  <CardHeader>
                    <div className={cn("mb-2", link.color)}>
                      <link.icon className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-xl">{link.title}</CardTitle>
                    <CardDescription>{link.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest actions and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <p className="font-medium">Pipeline executed successfully</p>
                    <p className="text-sm text-muted-foreground">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="h-2 w-2 rounded-full bg-accent mt-2" />
                  <div className="flex-1">
                    <p className="font-medium">New integration connected</p>
                    <p className="text-sm text-muted-foreground">1 hour ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="h-2 w-2 rounded-full bg-success mt-2" />
                  <div className="flex-1">
                    <p className="font-medium">Files uploaded</p>
                    <p className="text-sm text-muted-foreground">3 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="mt-6">
          <ChatAssistant />
        </TabsContent>
      </Tabs>
    </div>
  );
}
