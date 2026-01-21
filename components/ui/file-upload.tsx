"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ImagePlus, Trash2, Upload } from "lucide-react";
import { showToast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  uploadEndpoint?: string;
  maxFileSize?: number;
  accept?: string;
  className?: string;
}

export function FileUpload({
  images,
  onChange,
  uploadEndpoint = "/api/upload",
  maxFileSize = 4.5 * 1024 * 1024, // 4.5MB default
  accept = "image/*",
  className,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      // Validate files before upload
      const validFiles = fileArray.filter((file) => {
        if (!file.type.startsWith("image/")) {
          showToast.error(`${file.name} is not an image file`);
          return false;
        }
        if (file.size > maxFileSize) {
          showToast.error(
            `${file.name} exceeds the maximum file size of ${Math.round(maxFileSize / 1024 / 1024)}MB`
          );
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      setIsUploading(true);
      const newUrls: string[] = [];

      try {
        for (const file of validFiles) {
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch(uploadEndpoint, {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || `Failed to upload ${file.name}`);
          }

          const data = await response.json();
          newUrls.push(data.url);
        }

        onChange([...images, ...newUrls]);
        showToast.success(
          "Uploaded",
          `${newUrls.length} image${newUrls.length > 1 ? "s" : ""} uploaded successfully`
        );
      } catch (err) {
        showToast.error(err instanceof Error ? err.message : "Upload failed");
        console.error("Upload error:", err);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [images, onChange, uploadEndpoint, maxFileSize]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      uploadFiles(e.target.files);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        uploadFiles(files);
      }
    },
    [uploadFiles]
  );

  const toggleImageSelection = (index: number) => {
    setSelectedImages((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedImages.size === images.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(images.map((_, i) => i)));
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
    setSelectedImages((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
  };

  const removeSelectedImages = () => {
    const selectedIndices = Array.from(selectedImages);
    const newImages = images.filter((_, i) => !selectedIndices.includes(i));
    onChange(newImages);
    setSelectedImages(new Set());
    showToast.success(
      "Deleted",
      `${selectedIndices.length} image${selectedIndices.length > 1 ? "s" : ""} removed`
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          isUploading && "opacity-50 pointer-events-none"
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2">
          {isUploading ? (
            <>
              <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium">
                Drag and drop images here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supports multiple images up to{" "}
                {Math.round(maxFileSize / 1024 / 1024)}MB each
              </p>
            </>
          )}
        </div>
      </div>

      {/* Toolbar */}
      {images.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={
                selectedImages.size === images.length && images.length > 0
              }
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedImages.size > 0
                ? `${selectedImages.size} of ${images.length} selected`
                : `${images.length} image${images.length > 1 ? "s" : ""}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {selectedImages.size > 0 && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={removeSelectedImages}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected ({selectedImages.size})
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <ImagePlus className="mr-2 h-4 w-4" />
              Add More
            </Button>
          </div>
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className={cn(
                "relative aspect-square group rounded-lg overflow-hidden border-2 transition-colors",
                selectedImages.has(index)
                  ? "border-primary"
                  : "border-transparent"
              )}
            >
              <Image
                src={url}
                alt={`Uploaded image ${index + 1}`}
                fill
                className="object-cover"
              />
              {/* Checkbox overlay */}
              <div
                className={cn(
                  "absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors",
                  selectedImages.has(index) && "bg-black/20"
                )}
              />
              <div className="absolute top-2 left-2">
                <Checkbox
                  checked={selectedImages.has(index)}
                  onCheckedChange={() => toggleImageSelection(index)}
                  className="bg-white data-[state=checked]:bg-primary"
                />
              </div>
              {/* Individual delete button */}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(index);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              {/* Selection indicator */}
              {selectedImages.has(index) && (
                <div className="absolute bottom-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                  Selected
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
