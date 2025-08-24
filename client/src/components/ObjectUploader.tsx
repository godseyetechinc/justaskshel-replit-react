import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
  disabled?: boolean;
}

/**
 * A file upload component specifically designed for claims document attachments.
 * 
 * Features:
 * - Renders as a customizable button that opens a file upload modal
 * - Supports multiple file types (PDF, JPEG, PNG, DOC, DOCX)
 * - Enforces size limits: 500KB for documents, 200KB for images
 * - Maximum of 10 files per upload
 * - Provides drag & drop interface with upload progress
 * 
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed (default: 10)
 * @param props.maxFileSize - Maximum file size in bytes (default: 500KB)
 * @param props.allowedFileTypes - Array of allowed MIME types
 * @param props.onGetUploadParameters - Function to get presigned upload URL
 * @param props.onComplete - Callback when upload completes
 * @param props.buttonClassName - CSS classes for the button
 * @param props.children - Button content
 * @param props.disabled - Whether the upload button is disabled
 */
export function ObjectUploader({
  maxNumberOfFiles = 10,
  maxFileSize = 512000, // 500KB default
  allowedFileTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png', 
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
  disabled = false,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uppy] = useState(() => {
    const uppyInstance = new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
        allowedFileTypes,
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: async (file) => {
          // Validate file size based on type
          const isImage = file.type?.startsWith('image/');
          const sizeLimit = isImage ? 204800 : 512000; // 200KB for images, 500KB for documents
          
          if (file.size && file.size > sizeLimit) {
            throw new Error(`File "${file.name}" is too large. ${isImage ? 'Images' : 'Documents'} must be under ${Math.round(sizeLimit / 1024)}KB.`);
          }
          
          return await onGetUploadParameters();
        },
      })
      .on("complete", (result) => {
        onComplete?.(result);
        setShowModal(false);
      })
      .on("error", (error) => {
        console.error("Upload error:", error);
      });
    
    return uppyInstance;
  });

  return (
    <div>
      <Button 
        onClick={() => setShowModal(true)} 
        className={buttonClassName}
        disabled={disabled}
        data-testid="button-upload-files"
      >
        {children}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
        note={`Supported formats: PDF, JPEG, PNG, DOC, DOCX. Max ${maxNumberOfFiles} files. Documents: 500KB max, Images: 200KB max.`}
      />
    </div>
  );
}
