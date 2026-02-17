import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, File, Trash2, Download, HardDrive, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { calculateFileChecksum } from "@/utils/fileHash";
import { usePipeline } from "@/contexts/PipelineContext";
import { useAppContext } from "@/contexts/AppContext";
import { BUCKET_NAME } from "@/constants/storage";

interface UploadingFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'completed' | 'failed';
}

const ALLOWED_FILE_TYPES = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
};

const FILE_SIZE_LIMITS: Record<string, number> = {
  pdf: 10 * 1024 * 1024,
  docx: 5 * 1024 * 1024,
  txt: 2 * 1024 * 1024,
};

const getFileExtension = (fileName: string): string => {
  return fileName.split(".").pop()?.toLowerCase() || "";
};

const getContentType = (fileName: string): string | null => {
  const ext = getFileExtension(fileName);
  return ALLOWED_FILE_TYPES[ext as keyof typeof ALLOWED_FILE_TYPES] || null;
};

export default function Files() {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [deletingFiles, setDeletingFiles] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isGoogleDriveConnected, setIsGoogleDriveConnected] = useState(false);
  const { toast } = useToast();
  const { addFileId, setTriggerBy, files, fetchFiles } = usePipeline();
  const { workspaceId } = useAppContext();

  useEffect(() => {
    const storedConnection = localStorage.getItem("googleDriveConnected");
    setIsGoogleDriveConnected(storedConnection === "true");

    // Set trigger_by user ID
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setTriggerBy(session.user.id);
      }
    });
  }, [setTriggerBy]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  };

  const uploadFileToStorage = async (file: File, uploadingFileId: string) => {
    try {
      // Update status to uploading
      setUploadingFiles((prev) =>
        prev.map((f) => (f.id === uploadingFileId ? { ...f, status: 'uploading' as const } : f))
      );

      // Validate file type
      const contentType = getContentType(file.name);
      if (!contentType) {
        throw new Error(
          `File type not supported. Only ${Object.keys(ALLOWED_FILE_TYPES).join(", ")} files are allowed.`,
        );
      }

      // Get JWT token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      // Step 1: Get signed URL
      const signedUrlResponse = await fetch("https://kcndgryyfmleusefjowx.supabase.co/functions/v1/signed-upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: contentType,
          folder: workspaceId || session.user.id,
        }),
      });

      if (!signedUrlResponse.ok) {
        throw new Error("Failed to get signed URL");
      }

      const { uploadUrl, token } = await signedUrlResponse.json();

      // Step 2: Upload file to signed URL
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": contentType,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      // Step 3: Calculate checksum and insert into database
      const checksum = await calculateFileChecksum(file);
      const storagePath = `${workspaceId || session.user.id}/${file.name}`;

      const { data: insertedFile, error: dbError } = await supabase
        .from("files")
        .insert({
          uploaded_by: session.user.id,
          filename: file.name,
          mime_type: contentType,
          size_bytes: file.size,
          source: "upload",
          storage_path: storagePath,
          checksum: checksum,
          indexing_status: "pending",
          workspace_id: workspaceId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (dbError) {
        throw new Error(`Failed to save file metadata: ${dbError.message}`);
      }

      // Add file ID to pipeline context and refresh files from database
      if (insertedFile?.id) {
        addFileId(insertedFile.id);
        await fetchFiles();
      }

      // Mark as completed and remove after a brief display
      setUploadingFiles((prev) =>
        prev.map((f) => (f.id === uploadingFileId ? { ...f, status: 'completed' as const } : f))
      );

      // Remove after 1 second to show completion state
      setTimeout(() => {
        setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadingFileId));
      }, 1000);

      toast({
        title: "Upload successful",
        description: `${file.name} uploaded successfully`,
      });
    } catch (error) {
      console.error("Upload error:", error);

      // Mark as failed
      setUploadingFiles((prev) =>
        prev.map((f) => (f.id === uploadingFileId ? { ...f, status: 'failed' as const } : f))
      );

      // Remove after 2 seconds
      setTimeout(() => {
        setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadingFileId));
      }, 2000);

      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleFiles = async (newFiles: File[]) => {
    // Validate file types first
    const invalidFiles = newFiles.filter((file) => !getContentType(file.name));

    if (invalidFiles.length > 0) {
      const msg = `Only ${Object.keys(ALLOWED_FILE_TYPES).join(", ")} files are allowed.`;
      setUploadError(msg);
      toast({ title: "Invalid file type", description: msg, variant: "destructive", duration: 5000 });
      return;
    }

    // Validate file size limits
    const oversizedFiles = newFiles.filter((file) => {
      const ext = getFileExtension(file.name);
      const limit = FILE_SIZE_LIMITS[ext];
      return limit && file.size > limit;
    });

    if (oversizedFiles.length > 0) {
      const details = oversizedFiles
        .map((file) => {
          const ext = getFileExtension(file.name);
          const limitMB = (FILE_SIZE_LIMITS[ext] / (1024 * 1024)).toFixed(0);
          const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
          return `${file.name} (${sizeMB} MB, max ${limitMB} MB)`;
        })
        .join(", ");
      const msg = `File(s) exceed size limits: ${details}`;
      setUploadError(msg);
      toast({ title: "File too large", description: msg, variant: "destructive", duration: 5000 });
      return;
    }

    setUploadError(null);

    // Create uploading file items for tracking
    const uploadingFileItems: UploadingFile[] = newFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      status: 'uploading' as const,
    }));

    // Add all files to uploading state at once
    setUploadingFiles((prev) => [...uploadingFileItems, ...prev]);

    // Upload files sequentially
    for (let i = 0; i < newFiles.length; i++) {
      await uploadFileToStorage(newFiles[i], uploadingFileItems[i].id);
    }
  };

  const handleGoogleDriveUpload = () => {
    toast({
      title: "Google Drive integration",
      description: "This feature will be available soon",
    });
  };

  const handleDelete = async (id: string) => {
    // Add to deleting state
    setDeletingFiles((prev) => [...prev, id]);

    try {
      // Get current user session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      // Get file details from context
      const fileData = files.find((f) => f.id === id);
      if (!fileData) {
        throw new Error("File not found");
      }

      // Step 1: Mark file as deleted in database
      const { error: updateError } = await supabase
        .from("files")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateError) {
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      // Step 2: Delete file from storage bucket
      const storagePath = fileData.storage_path || `${session.user.id}/${fileData.filename}`;
      console.log("Attempting to delete file from storage:", storagePath, "Bucket:", BUCKET_NAME);

      const { data: deleteData, error: storageError } = await supabase.storage.from(BUCKET_NAME).remove([storagePath]);

      console.log("Storage deletion result:", { deleteData, storageError });

      if (storageError) {
        console.error("Storage deletion error details:", storageError);
        
        // Rollback database update if storage deletion fails
        await supabase
          .from("files")
          .update({
            is_deleted: false,
            deleted_at: null,
          })
          .eq("id", id);

        throw new Error(`Storage deletion failed: ${storageError.message}`);
      }

      // Refresh files from context
      await fetchFiles();

      toast({
        title: "File deleted successfully",
        description: `${fileData.filename} has been removed from storage`,
      });
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete file. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      // Remove from deleting state
      setDeletingFiles((prev) => prev.filter((fId) => fId !== id));
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">File Management</h1>
        <p className="text-muted-foreground text-lg">Upload and manage your files</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Files</CardTitle>
            <CardDescription>Drag and drop files or click to browse</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 ${
                isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-border hover:border-primary/50"
              }`}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Drop files here</p>
              <p className="text-sm text-muted-foreground mb-4">or click the button below to browse</p>
              <p className="text-xs text-muted-foreground mb-2">Supported formats: PDF (max 10 MB), DOCX (max 5 MB), TXT (max 2 MB)</p>
              {uploadError && (
                <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm text-left">
                  {uploadError}
                </div>
              )}
              <label htmlFor="file-upload">
                <Button type="button" onClick={() => { setUploadError(null); document.getElementById("file-upload")?.click(); }}>
                  Select Files
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Google Drive Import</CardTitle>
            <CardDescription>Import files from your Google Drive</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed rounded-lg p-12 text-center">
              <HardDrive className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Google Drive</p>
              {isGoogleDriveConnected ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">Your Google Drive is connected</p>
                  <Button onClick={handleGoogleDriveUpload}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import from Drive
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect Google Drive in the Integrations tab to import files
                  </p>
                  <Button variant="outline" disabled>
                    Not Connected
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Files</CardTitle>
          <CardDescription>
            {files.length} file(s) in storage
            {uploadingFiles.length > 0 && ` • ${uploadingFiles.length} uploading`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Show uploading files first */}
            {uploadingFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-4 flex-1">
                  {file.status === 'uploading' ? (
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  ) : file.status === 'completed' ? (
                    <File className="h-8 w-8 text-green-500" />
                  ) : (
                    <File className="h-8 w-8 text-destructive" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {file.status === 'uploading' && `Currently uploading...`}
                      {file.status === 'completed' && `Upload complete!`}
                      {file.status === 'failed' && `Upload failed`}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Show uploaded files */}
            {files.length === 0 && uploadingFiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No files uploaded yet</div>
            ) : (
              files.map((file) => {
                const isDeleting = deletingFiles.includes(file.id);
                return (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {isDeleting ? (
                        <Loader2 className="h-8 w-8 text-destructive animate-spin" />
                      ) : (
                        <File className="h-8 w-8 text-primary" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.filename}</p>
                        <p className="text-sm text-muted-foreground">
                          {isDeleting
                            ? "Deleting..."
                            : `${(file.size_bytes / 1024 / 1024).toFixed(2)} MB • ${new Date(file.created_at).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center ml-4">
                      <Button variant="ghost" size="icon" disabled={isDeleting}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(file.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
