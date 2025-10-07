import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Github, Slack, Trello, Chrome, Mail, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: any;
  connected: boolean;
  category: string;
}

export default function Integrations() {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "1",
      name: "GitHub",
      description: "Connect your GitHub repositories",
      icon: Github,
      connected: true,
      category: "Development"
    },
    {
      id: "2",
      name: "Slack",
      description: "Get notifications in Slack",
      icon: Slack,
      connected: true,
      category: "Communication"
    },
    {
      id: "3",
      name: "Trello",
      description: "Sync with your Trello boards",
      icon: Trello,
      connected: false,
      category: "Project Management"
    },
    {
      id: "4",
      name: "Chrome Extension",
      description: "Browser extension integration",
      icon: Chrome,
      connected: false,
      category: "Tools"
    },
    {
      id: "5",
      name: "Email",
      description: "Email notifications and alerts",
      icon: Mail,
      connected: true,
      category: "Communication"
    },
    {
      id: "6",
      name: "Database",
      description: "External database connection",
      icon: Database,
      connected: false,
      category: "Data"
    },
  ]);

  const toggleConnection = (id: string) => {
    setIntegrations(integrations.map(integration => {
      if (integration.id === id) {
        const newState = !integration.connected;
        toast({
          title: newState ? "Connected" : "Disconnected",
          description: `${integration.name} has been ${newState ? "connected" : "disconnected"}`,
        });
        return { ...integration, connected: newState };
      }
      return integration;
    }));
  };

  const connectedCount = integrations.filter(i => i.connected).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Integrations</h1>
        <p className="text-muted-foreground text-lg">
          Connect your favorite tools and services
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl">{connectedCount}</CardTitle>
            <CardDescription>Active Integrations</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl">{integrations.length}</CardTitle>
            <CardDescription>Total Available</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl">{integrations.length - connectedCount}</CardTitle>
            <CardDescription>Not Connected</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((integration) => (
          <Card key={integration.id} className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <integration.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{integration.name}</CardTitle>
                    <CardDescription>{integration.description}</CardDescription>
                  </div>
                </div>
                <Badge variant={integration.connected ? "default" : "secondary"}>
                  {integration.connected ? "Connected" : "Available"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{integration.category}</span>
                <Button
                  variant={integration.connected ? "outline" : "default"}
                  onClick={() => toggleConnection(integration.id)}
                >
                  {integration.connected ? "Disconnect" : "Connect"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
