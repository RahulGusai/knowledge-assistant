import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Github, Slack, Trello, Chrome, Mail, Database, HardDrive } from "lucide-react";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
}

const integrationsList: Integration[] = [
  { id: "1", name: "Google Drive", description: "Access and upload files from Google Drive", icon: HardDrive, category: "Storage" },
  { id: "2", name: "GitHub", description: "Connect your GitHub repositories", icon: Github, category: "Development" },
  { id: "3", name: "Slack", description: "Get notifications in Slack", icon: Slack, category: "Communication" },
  { id: "4", name: "Trello", description: "Sync with your Trello boards", icon: Trello, category: "Project Management" },
  { id: "5", name: "Chrome Extension", description: "Browser extension integration", icon: Chrome, category: "Tools" },
  { id: "6", name: "Email", description: "Email notifications and alerts", icon: Mail, category: "Communication" },
  { id: "7", name: "Database", description: "External database connection", icon: Database, category: "Data" },
];

export default function Integrations() {
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
            <CardTitle className="text-2xl">0</CardTitle>
            <CardDescription>Active Integrations</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl">{integrationsList.length}</CardTitle>
            <CardDescription>Planned</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl">0</CardTitle>
            <CardDescription>Available Now</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrationsList.map((integration) => (
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
                <Badge variant="outline">Coming Soon</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{integration.category}</span>
                <p className="text-sm text-muted-foreground italic">We're working on this! 🚀</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
