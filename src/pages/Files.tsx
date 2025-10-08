import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, File, Trash2, Download, HardDrive, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Progress } from "@/components/ui/progress";
import { BUCKET_NAME } from "@/constants/storage";
import { calculateFileChecksum } from "@/utils/fileHash";

interface FileItem {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  status: 'uploading' | 'success' | 'failed';
  progress: number;
  filePath?: string;
}

const ALLOWED_FILE_TYPES = {
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'txt': 'text/plain',
  'csv': 'text/csv'
};

const getFileExtension = (fileName: string): string => {
  return fileName.split('.').pop()?.toLowerCase() || '';
};

const getContentType = (fileName: string): string | null => {
  const ext = getFileExtension(fileName);
  return ALLOWED_FILE_TYPES[ext as keyof typeof ALLOWED_FILE_TYPES] || null;
};

export default function Files() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isGoogleDriveConnected, setIsGoogleDriveConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const storedConnection = localStorage.getItem("googleDriveConnected");
    setIsGoogleDriveConnected(storedConnection === "true");
  }, []);

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

  const uploadFileToStorage = async (file: File, fileItem: FileItem) => {
    try {
      // Validate file type
      const contentType = getContentType(file.name);
      if (!contentType) {
        throw new Error(`File type not supported. Only ${Object.keys(ALLOWED_FILE_TYPES).join(', ')} files are allowed.`);
      }

      // Get JWT token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Step 1: Get signed URL
      const signedUrlResponse = await fetch(
        'https://kcndgryyfmleusefjowx.supabase.co/functions/v1/signed-upload',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName: file.name,
            contentType: contentType,
            folder: session.user.id
          }),
        }
      );

      if (!signedUrlResponse.ok) {
        throw new Error('Failed to get signed URL');
      }

      const { uploadUrl, token } = await signedUrlResponse.json();

      // Step 2: Upload file to signed URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': contentType,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      // Step 3: Calculate checksum and insert into database
      const checksum = await calculateFileChecksum(file);
      const storagePath = `${BUCKET_NAME}/${file.name}`;
      
      const { error: dbError } = await supabase
        .from('files')
        .insert({
          uploaded_by: session.user.id,
          filename: file.name,
          mime_type: contentType,
          size_bytes: file.size,
          source: 'upload',
          storage_path: storagePath,
          checksum: checksum,
          status: 'uploaded',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (dbError) {
        throw new Error(`Failed to save file metadata: ${dbError.message}`);
      }

      // Update file status to success
      setFiles(prevFiles =>
        prevFiles.map(f =>
          f.id === fileItem.id
            ? { ...f, status: 'success' as const, progress: 100 }
            : f
        )
      );

      toast({
        title: "Upload successful",
        description: `${file.name} uploaded successfully`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      
      // Update file status to failed
      setFiles(prevFiles =>
        prevFiles.map(f =>
          f.id === fileItem.id
            ? { ...f, status: 'failed' as const, progress: 0 }
            : f
        )
      );

      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : 'Failed to upload file',
        variant: "destructive",
      });
    }
  };

  const handleFiles = async (newFiles: File[]) => {
    // Validate file types first
    const invalidFiles = newFiles.filter(file => !getContentType(file.name));
    
    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid file type",
        description: `Only ${Object.keys(ALLOWED_FILE_TYPES).join(', ')} files are allowed.`,
        variant: "destructive",
      });
      return;
    }

    // Create file items with uploading status
    const fileItems: FileItem[] = newFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      uploadedAt: new Date().toISOString().split('T')[0],
      status: 'uploading' as const,
      progress: 0,
    }));

    // Add files to state immediately
    setFiles(prevFiles => [...fileItems, ...prevFiles]);

    // Start uploading each file
    fileItems.forEach((fileItem, index) => {
      // Simulate progress for UI feedback
      const progressInterval = setInterval(() => {
        setFiles(prevFiles =>
          prevFiles.map(f =>
            f.id === fileItem.id && f.status === 'uploading'
              ? { ...f, progress: Math.min(f.progress + 10, 90) }
              : f
          )
        );
      }, 200);

      // Upload file
      uploadFileToStorage(newFiles[index], fileItem).finally(() => {
        clearInterval(progressInterval);
      });
    });
  };

  const handleGoogleDriveUpload = () => {
    const mockGoogleDriveFiles: FileItem[] = [
      {
        id: Math.random().toString(36).substr(2, 9),
        name: "google-drive-document.docx",
        size: "1.8 MB",
        uploadedAt: new Date().toISOString().split('T')[0],
        status: 'success',
        progress: 100,
      },
      {
        id: Math.random().toString(36).substr(2, 9),
        name: "google-drive-presentation.pptx",
        size: "3.2 MB",
        uploadedAt: new Date().toISOString().split('T')[0],
        status: 'success',
        progress: 100,
      },
    ];

    setFiles(prevFiles => [...mockGoogleDriveFiles, ...prevFiles]);
    toast({
      title: "Files imported from Google Drive",
      description: `${mockGoogleDriveFiles.length} file(s) imported successfully`,
    });
  };

  const handleDelete = (id: string) => {
    setFiles(prevFiles => prevFiles.filter(file => file.id !== id));
    toast({
      title: "File deleted",
      description: "The file has been removed",
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">File Management</h1>
        <p className="text-muted-foreground text-lg">
          Upload and manage your files
        </p>
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
                isDragging
                  ? "border-primary bg-primary/5 scale-[1.02]"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Drop files here</p>
              <p className="text-sm text-muted-foreground mb-4">
                or click the button below to browse
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Supported formats: PDF, DOC, DOCX, TXT, CSV
              </p>
              <label htmlFor="file-upload">
                <Button type="button" onClick={() => document.getElementById('file-upload')?.click()}>
                  Select Files
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.csv"
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
                  <p className="text-sm text-muted-foreground mb-4">
                    Your Google Drive is connected
                  </p>
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
          <CardDescription>{files.length} file(s) in storage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <File className="h-8 w-8 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {file.size} • {file.uploadedAt}
                    </p>
                    {file.status === 'uploading' && (
                      <div className="mt-2">
                        <Progress value={file.progress} className="h-2" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 items-center ml-4">
                  {file.status === 'uploading' && (
                    <span className="text-sm text-muted-foreground">Uploading...</span>
                  )}
                  {file.status === 'success' && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm">Uploaded</span>
                    </div>
                  )}
                  {file.status === 'failed' && (
                    <div className="flex items-center gap-1 text-destructive">
                      <XCircle className="h-5 w-5" />
                      <span className="text-sm">Failed</span>
                    </div>
                  )}
                  {file.status === 'success' && (
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(file.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
