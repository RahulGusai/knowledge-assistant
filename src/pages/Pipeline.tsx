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

// Progress mapping for pipeline statuses
const PROGRESS_MAP: Record<string, number> = {
  created: 0,
  queued: 5,
  validating: 10,
  validation_failed: 0,
  snapshot_created: 25,
  delta_calculated: 40,
  ingesting: 60,
  ingestion_failed: 0,
  embeddings_created: 95,
  completed: 100,
  failed: 0,
  cancelled: 0,
};

const TERMINAL_ERROR_STATUSES = ['validation_failed', 'ingestion_failed', 'failed', 'cancelled'];
const KNOWN_HAPPY_STATUSES = ['created', 'queued', 'validating', 'snapshot_created', 'delta_calculated', 'ingesting', 'embeddings_created', 'completed'];

// Job status to friendly message mapping
const JOB_STATUS_MESSAGES: Record<string, { message: string; progress: number }> = {
  created: { message: "Pipeline job created and initializing...", progress: PROGRESS_MAP.created },
  queued: { message: "Pipeline is queued and waiting to start...", progress: PROGRESS_MAP.queued },
  validating: { message: "Validating files and prerequisites...", progress: PROGRESS_MAP.validating },
  validation_failed: { message: "Validation failed - please check your files", progress: 0 },
  snapshot_created: { message: "Just took a snapshot of the job to save us future troubles", progress: PROGRESS_MAP.snapshot_created },
  delta_calculated: { message: "Hang on tight... job delta created successfully!", progress: PROGRESS_MAP.delta_calculated },
  ingesting: { message: "Ingesting and processing your documents...", progress: PROGRESS_MAP.ingesting },
  ingestion_failed: { message: "Failed to ingest documents - please try again", progress: 0 },
  embeddings_created: { message: "Generated AI embeddings for semantic search", progress: PROGRESS_MAP.embeddings_created },
  completed: { message: "Pipeline completed successfully! ✨", progress: PROGRESS_MAP.completed },
  failed: { message: "Pipeline encountered an error", progress: 0 },
  cancelled: { message: "Pipeline was cancelled", progress: 0 },
};

export default function Pipeline() {
  const { toast } = useToast();
  const { fileIds, workspaceId, triggerBy } = usePipeline();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>("");
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Get progress bar color based on progress value
  const getProgressVariant = (progress: number): "default" | "accent" | "success" | "warning" => {
    if (progress >= 95) return "success";
    if (progress >= 60) return "accent";
    if (progress >= 25) return "default";
    return "default";
  };

  // Listen to job status updates via Supabase realtime
  useEffect(() => {
    if (!supabase || !isRunning) return;

    // Clear any existing timeout when we start listening
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }

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
          
          // Only process if it matches our workspace_id
          if (job.workspace_id === workspaceId) {
            // Clear timeout since we received an update
            if (timeoutId) {
              clearTimeout(timeoutId);
              setTimeoutId(null);
            }

            const status = job.status as string;
            
            // Treat unknown statuses as failures if they're not in the known happy path
            const isUnknownStatus = !KNOWN_HAPPY_STATUSES.includes(status) && !TERMINAL_ERROR_STATUSES.includes(status);
            const statusInfo = JOB_STATUS_MESSAGES[status] || { message: "Unknown error occurred", progress: 0 };
            
            setCurrentStatus(status);
            setProgressMessage(statusInfo.message);
            
            // Handle ingesting phase with animated progress (60-90%)
            if (status === 'ingesting') {
              // Start at 60% and animate to 90%
              let currentProgress = 60;
              const interval = setInterval(() => {
                currentProgress += 2;
                if (currentProgress <= 90) {
                  setProgress(currentProgress);
                } else {
                  clearInterval(interval);
                }
              }, 300);
              return () => clearInterval(interval);
            } else {
              setProgress(statusInfo.progress);
            }

            // Terminal success state
            if (status === 'completed') {
              setIsRunning(false);
              setRuns(prevRuns => prevRuns.map(run => 
                run.id === currentRunId 
                  ? { ...run, status: "success" as const, duration: "Completed" }
                  : run
              ));
              toast({
                title: "Pipeline completed successfully",
                description: "The pipeline ran successfully",
              });
            } 
            // Terminal error states or unknown statuses - stop everything
            else if (TERMINAL_ERROR_STATUSES.includes(status) || isUnknownStatus) {
              setIsRunning(false);
              setProgress(0);
              setProgressMessage("");
              setRuns(prevRuns => prevRuns.map(run => 
                run.id === currentRunId 
                  ? { ...run, status: "failed" as const, duration: "Failed" }
                  : run
              ));
              toast({
                title: status === 'cancelled' ? "Pipeline cancelled" : "Pipeline failed",
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
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isRunning, workspaceId, toast, currentRunId, timeoutId]);

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

    setCurrentRunId(newRun.id);
    setRuns([newRun, ...runs]);

    try {
      // Prepare payload
      const payload = {
        file_ids: fileIds,
        workspace_id: workspaceId,
        trigger_by: triggerBy,
      };

      setProgressMessage("Sending request to pipeline...");
      setProgress(5);

      // Trigger pipeline and handle response
      const response = await fetch(API_ENDPOINTS.PIPELINE_TRIGGER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error("Pipeline API returned invalid response format");
      }

      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error("Pipeline API returned invalid JSON response");
      }
      
      // Check if success field is false
      if (result.success === false) {
        throw new Error(result.error || result.message || "Pipeline API returned failure status");
      }

      // Check if API returned success=true, mark as immediate success
      if (result.success === true) {
        setIsRunning(false);
        setProgress(100);
        setProgressMessage("Pipeline completed successfully! ✨");
        setRuns(prevRuns => prevRuns.map(run => 
          run.id === newRun.id 
            ? { ...run, status: "success" as const, duration: "Completed" }
            : run
        ));
        toast({
          title: "Pipeline completed successfully",
          description: "The pipeline ran successfully",
        });
        return;
      }

      // Check if API returned without starting a job
      if (!result || result.error) {
        throw new Error(result?.error || "Pipeline API returned without starting job");
      }

      // Set a timeout to detect if job never starts or stalls (5 minutes)
      const timeout = setTimeout(() => {
        setIsRunning(false);
        setProgress(0);
        setProgressMessage("");
        setRuns(prevRuns => prevRuns.map(run => 
          run.id === newRun.id 
            ? { ...run, status: "failed" as const, duration: "Failed" }
            : run
        ));
        toast({
          title: "Pipeline timeout",
          description: "No status update received within 5 minutes. Pipeline failed.",
          variant: "destructive",
        });
      }, 300000); // 5 minutes timeout

      setTimeoutId(timeout);

      // Start listening for updates
      setProgressMessage("Waiting for pipeline updates...");
      setProgress(10);
    } catch (error) {
      setIsRunning(false);
      setRuns(prevRuns => prevRuns.map(run => 
        run.id === newRun.id 
          ? { ...run, status: "failed" as const, duration: "Failed" }
          : run
      ));
      toast({
        title: "Pipeline failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
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
        return "bg-gradient-to-r from-success to-success/80 text-success-foreground shadow-lg";
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
                      <Progress 
                        value={progress} 
                        variant={getProgressVariant(progress)}
                        className="h-2" 
                      />
                      <p className="text-xs text-muted-foreground">{progressMessage}</p>
                      <p className="text-xs font-medium">{progress}%</p>
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
