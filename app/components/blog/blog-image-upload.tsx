import { useState, useRef, useEffect } from "react";
import { FiUpload, FiX, FiEdit2 } from "react-icons/fi";
import { motion } from "framer-motion";
import { getToken } from "~/lib/api";

interface BlogImageUploadProps {
  value?: string;
  onChange?: (url: string) => void;
  className?: string;
}

export function BlogImageUpload({ value, onChange, className = "" }: BlogImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [imageError, setImageError] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync preview with value prop changes
  useEffect(() => {
    if (value) {
      setPreview(value);
      setImageError(false);
      setShowEdit(false);
    } else {
      setPreview(null);
    }
  }, [value]);

  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      alert("Please upload a JPEG, PNG, or WebP image");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    setUploading(true);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/blog/upload-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required. Please log in again.");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to upload image");
      }

      const data = await response.json();
      setPreview(data.url);
      onChange?.(data.url);
    } catch (error: any) {
      console.error("Error uploading image:", error);
      alert(error.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleRemove = () => {
    setPreview(null);
    setShowEdit(false);
    onChange?.("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEdit = () => {
    setShowEdit(true);
  };

  const handleCancelEdit = () => {
    setShowEdit(false);
  };

  // If there's a value (image URL) and not in edit mode, show the image
  if (preview && !showEdit) {
    return (
      <div className={className}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative rounded-lg border-2 border-neutral-900 overflow-hidden bg-neutral-100 shadow-[2px_2px_0px_0px_rgba(25,26,35,1)]"
        >
          <div className="relative h-64 w-full overflow-hidden">
            {imageError ? (
              <div className="flex flex-col items-center justify-center h-full bg-neutral-200 p-4">
                <p className="text-sm font-['Satoshi'] text-neutral-600 mb-2">Image failed to load</p>
                <p className="text-xs font-['Satoshi'] text-neutral-500 break-all text-center px-4">{preview}</p>
              </div>
            ) : (
              <img
                src={preview}
                alt="Featured image preview"
                className="h-full w-full object-cover transition-transform hover:scale-105"
                onError={() => setImageError(true)}
                onLoad={() => setImageError(false)}
              />
            )}
          </div>
          <div className="absolute top-3 right-3 flex gap-2">
            <motion.button
              type="button"
              onClick={handleEdit}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="rounded-full bg-violet-500 p-2 text-white shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] hover:bg-violet-600 hover:shadow-[3px_3px_0px_0px_rgba(25,26,35,1)] transition-all border-2 border-neutral-900"
              title="Edit/Replace image"
            >
              <FiEdit2 className="w-4 h-4" />
            </motion.button>
            <motion.button
              type="button"
              onClick={handleRemove}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="rounded-full bg-red-500 p-2 text-white shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] hover:bg-red-600 hover:shadow-[3px_3px_0px_0px_rgba(25,26,35,1)] transition-all border-2 border-neutral-900"
              title="Remove image"
            >
              <FiX className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Show upload/edit interface
  return (
    <div className={className}>
      {showEdit && preview && (
        <div className="mb-4 p-3 rounded-lg border-2 border-neutral-900 bg-violet-50">
          <p className="text-sm font-['Satoshi'] text-neutral-700 mb-2">Current image URL:</p>
          <p className="text-xs font-['Satoshi'] text-neutral-600 break-all mb-3">{preview}</p>
          <motion.button
            type="button"
            onClick={handleCancelEdit}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="text-sm font-['Satoshi'] text-violet-600 hover:text-violet-800 underline"
          >
            Cancel editing
          </motion.button>
        </div>
      )}
      <motion.div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-900 bg-studojo-surface-muted p-8 transition-colors hover:bg-violet-50"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleFileSelect(file);
            }
          }}
          className="hidden"
        />
        {uploading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="mb-4 h-12 w-12 border-4 border-neutral-900 border-t-violet-500 rounded-full"
          />
        ) : (
          <FiUpload className="mb-4 h-12 w-12 text-gray-400" />
        )}
        <p className="mb-2 font-['Satoshi'] text-sm font-medium text-gray-600">
          {uploading ? "Uploading..." : showEdit ? "Upload a new image to replace the current one" : "Drag and drop an image, or click to select"}
        </p>
        <motion.button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi'] text-sm font-medium hover:bg-gray-50 disabled:opacity-50 shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] hover:shadow-[3px_3px_0px_0px_rgba(25,26,35,1)] transition-shadow"
        >
          {uploading ? "Uploading..." : "Select Image"}
        </motion.button>
        <p className="mt-2 text-xs font-['Satoshi'] text-gray-500">
          JPEG, PNG, or WebP (max 5MB)
        </p>
      </motion.div>
    </div>
  );
}

