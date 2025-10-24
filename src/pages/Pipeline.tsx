import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, StopCircle, Clock, CheckCircle2, XCircle, RefreshCw, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePipeline } from "@/contexts/PipelineContext";
import { API_ENDPOINTS } from "@/constants/api";
import { supabase } from "@/lib/supabase";

interface PipelineRun {
  id: string;
  status: "running" | "success" | "failed" | "pending";
  startTime: string;
  duration?: string;
  trigger: string;
}

// Job status to friendly message mapping
const JOB_STATUS_MESSAGES: Record<string, { message: string; progress: number }> = {
  pending: { message: "Pipeline is queued and waiting to start...", progress: 10 },
  started: { message: "Pipeline execution has begun! 🚀", progress: 15 },
  files_downloaded: { message: "Successfully downloaded all files from storage", progress: 25 },
  files_extracted: { message: "Extracted and parsed file contents", progress: 35 },
  chunks_created: { message: "Split documents into digestible chunks", progress: 45 },
  embeddings_generated: { message: "Generated AI embeddings for semantic search", progress: 60 },
  delta_calculated: { message: "Hang on tight... job delta created successfully!", progress: 70 },
  snapshot_created: { message: "Just took a snapshot of the job to save us future troubles", progress: 80 },
  database_updated: { message: "Updated the database with new embeddings", progress: 90 },
  completed: { message: "Pipeline completed successfully! ✨", progress: 100 },
  failed: { message: "Pipeline encountered an error", progress: 0 },
  error: { message: "An unexpected error occurred", progress: 0 },
};

export default function Pipeline() {
  const { toast } = useToast();
  const { fileIds, workspaceId, triggerBy } = usePipeline();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  // Listen to job status updates via Supabase realtime
  useEffect(() => {
    if (!supabase || !currentJobId) return;

    const channel = supabase
      .channel('job-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          console.log('Job update received:', payload);
          
          // Only process INSERT and UPDATE events
          if (payload.eventType !== 'INSERT' && payload.eventType !== 'UPDATE') {
            return;
          }

          const job = payload.new as any;
          
          // Only process if it matches our workspace_id and current job
          if (job.workspace_id === workspaceId && job.id === currentJobId) {
            const status = job.status as string;
            const statusInfo = JOB_STATUS_MESSAGES[status] || JOB_STATUS_MESSAGES.started;
            
            setProgressMessage(statusInfo.message);
            setProgress(statusInfo.progress);

            // Handle completion or failure
            if (status === 'completed') {
              setIsRunning(false);
              setCurrentJobId(null);
              setRuns(prevRuns => prevRuns.map(run => 
                run.id === currentJobId 
                  ? { ...run, status: "success" as const, duration: "Completed" }
                  : run
              ));
              toast({
                title: "Pipeline completed successfully",
                description: "The pipeline ran successfully",
              });
            } else if (status === 'failed' || status === 'error') {
              setIsRunning(false);
              setCurrentJobId(null);
              setRuns(prevRuns => prevRuns.map(run => 
                run.id === currentJobId 
                  ? { ...run, status: "failed" as const, duration: "Failed" }
                  : run
              ));
              toast({
                title: "Pipeline failed",
                description: statusInfo.message,
                variant: "destructive",
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentJobId, workspaceId, toast]);

  const handleTrigger = async () => {
    // Check if files are available
    if (fileIds.length === 0) {
      toast({
        title: "Cannot run pipeline",
        description: "Please upload files before triggering the pipeline",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setProgressMessage("Initializing pipeline...");
    
    const newRun: PipelineRun = {
      id: Date.now().toString(),
      status: "running",
      startTime: new Date().toLocaleString(),
      trigger: "Manual"
    };

    setRuns([newRun, ...runs]);

    try {
      // Prepare payload
      const payload = {
        file_ids: fileIds,
        workspace_id: workspaceId,
        trigger_by: triggerBy,
      };

      setProgressMessage("Sending request to pipeline...");
      setProgress(20);

      // Make API call
      const response = await fetch(API_ENDPOINTS.PIPELINE_TRIGGER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}`, // TODO: Add token when available
        },
        body: JSON.stringify(payload),
      });

      setProgress(60);
      setProgressMessage("Processing pipeline response...");

      const result = await response.json();

      // If API returns a job_id, track it for realtime updates
      if (result.job_id) {
        setCurrentJobId(result.job_id);
        setProgressMessage("Job created! Waiting for status updates...");
      } else {
        // Fallback to old behavior if no job_id
        setProgress(100);
        if (result.success === true) {
          setIsRunning(false);
          setRuns(prevRuns => prevRuns.map(run => 
            run.id === newRun.id 
              ? { ...run, status: "success" as const, duration: "Completed" }
              : run
          ));
          toast({
            title: "Pipeline completed successfully",
            description: "The pipeline ran successfully",
          });
        } else {
          throw new Error(result.message || 'Pipeline execution failed');
        }
      }
    } catch (error) {
      setIsRunning(false);
      setCurrentJobId(null);
      setRuns(prevRuns => prevRuns.map(run => 
        run.id === newRun.id 
          ? { ...run, status: "failed" as const, duration: "Failed" }
          : run
      ));
      toast({
        title: "Pipeline failed",
        description: error instanceof Error ? error.message : "Failed to run pipeline",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: PipelineRun["status"]) => {
    switch (status) {
      case "running":
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case "success":
        return <CheckCircle2 className="h-4 w-4" />;
      case "failed":
        return <XCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: PipelineRun["status"]) => {
    switch (status) {
      case "running":
        return "bg-primary text-primary-foreground";
      case "success":
        return "bg-success text-success-foreground";
      case "failed":
        return "bg-destructive text-destructive-foreground";
      case "pending":
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Pipeline</h1>
        <p className="text-muted-foreground text-lg">
          Trigger and monitor your pipelines
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pipeline Control</CardTitle>
            <CardDescription>Manually trigger pipeline execution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-8 rounded-lg border-2 border-dashed bg-muted/30 text-center">
              {isRunning ? (
                <div className="space-y-4">
                  <RefreshCw className="h-16 w-16 mx-auto text-primary animate-spin" />
                  <div>
                    <p className="text-xl font-semibold mb-2">Pipeline Running</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Please wait while the pipeline executes...
                    </p>
                    <div className="max-w-md mx-auto space-y-2">
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-muted-foreground">{progressMessage}</p>
                    </div>
                  </div>
                  <Button variant="outline" disabled>
                    <StopCircle className="h-4 w-4 mr-2" />
                    Running...
                  </Button>
                </div>
              ) : fileIds.length === 0 ? (
                <div className="space-y-4">
                  <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-xl font-semibold mb-2">No Files Uploaded</p>
                    <p className="text-sm text-muted-foreground">
                      Please upload files from the Files tab before triggering the pipeline
                    </p>
                  </div>
                  <Button disabled size="lg" variant="outline">
                    <Play className="h-4 w-4 mr-2" />
                    Trigger Pipeline
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Play className="h-16 w-16 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-xl font-semibold mb-2">Ready to Run</p>
                    <p className="text-sm text-muted-foreground">
                      {fileIds.length} file(s) ready to process
                    </p>
                  </div>
                  <Button onClick={handleTrigger} size="lg">
                    <Play className="h-4 w-4 mr-2" />
                    Trigger Pipeline
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center p-4 rounded-lg bg-card border">
                <p className="text-2xl font-bold text-success">{runs.filter(r => r.status === "success").length}</p>
                <p className="text-sm text-muted-foreground">Successful</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-card border">
                <p className="text-2xl font-bold text-destructive">{runs.filter(r => r.status === "failed").length}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-card border">
                <p className="text-2xl font-bold">{runs.length}</p>
                <p className="text-sm text-muted-foreground">Total Runs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Pipeline performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Success Rate</span>
                <span className="font-medium">
                  {Math.round((runs.filter(r => r.status === "success").length / runs.length) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-success transition-all"
                  style={{
                    width: `${(runs.filter(r => r.status === "success").length / runs.length) * 100}%`
                  }}
                />
              </div>
            </div>

            <div className="pt-4 space-y-2 border-t">
              <p className="text-sm text-muted-foreground">Average Duration</p>
              <p className="text-2xl font-bold">2m 22s</p>
            </div>

            <div className="pt-4 space-y-2 border-t">
              <p className="text-sm text-muted-foreground">Last Run</p>
              <p className="font-medium">{runs[0]?.startTime || "Never"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Runs</CardTitle>
          <CardDescription>Pipeline execution history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {runs.map((run) => (
              <div
                key={run.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Badge className={getStatusColor(run.status)}>
                    {getStatusIcon(run.status)}
                    <span className="ml-2 capitalize">{run.status}</span>
                  </Badge>
                  <div>
                    <p className="font-medium">Pipeline Run #{run.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {run.startTime} • {run.duration || "In progress"} • Triggered by {run.trigger}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
