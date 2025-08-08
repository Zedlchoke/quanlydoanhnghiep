import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, File, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ObjectUploaderProps {
  onUpload: (result: any) => void;
  currentFile?: string;
  disabled?: boolean;
  accept?: string;
}

export function ObjectUploader({ onUpload, currentFile, disabled, accept = ".pdf" }: ObjectUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      // Get upload URL
      const uploadResponse = await fetch("/api/objects/upload", {
        method: "POST",
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadURL } = await uploadResponse.json();

      // Upload file to object storage
      const uploadFileResponse = await fetch(uploadURL, {
        method: "PUT",
        body: selectedFile,
        headers: {
          "Content-Type": selectedFile.type,
        },
      });

      if (!uploadFileResponse.ok) {
        throw new Error("Failed to upload file");
      }

      // Extract object path from upload URL
      const objectPath = uploadURL.split("?")[0].replace(
        "https://storage.googleapis.com",
        ""
      );

      onUpload({
        uploadURL: uploadURL,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        response: { objectPath: objectPath }
      });
      setSelectedFile(null);
      toast({
        title: "Thành công",
        description: "File đã được upload thành công",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Label>Upload File PDF</Label>
      <div className="flex items-center gap-3">
        <Input
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={disabled || uploading}
        />
        <Button
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile || uploading || disabled}
          size="sm"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? "Đang tải..." : "Upload"}
        </Button>
      </div>

      {currentFile && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <File className="h-4 w-4" />
          <span>File đã có: {currentFile.split("/").pop()}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => window.open(`/objects${currentFile}`, "_blank")}
          >
            Xem file
          </Button>
        </div>
      )}

      {selectedFile && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <File className="h-4 w-4" />
          <span>File chọn: {selectedFile.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelectedFile(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}