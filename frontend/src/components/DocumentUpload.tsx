'use client';

import { useState, useRef } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { documentsApi, Document } from '@/lib/api/documents';

interface DocumentUploadProps {
  tenantId: string;
  documentType: Document['documentType'];
  onUploadSuccess?: (document: Document) => void;
  onUploadError?: (error: string) => void;
  acceptedTypes?: string[];
  maxSizeMB?: number;
  label?: string;
  description?: string;
  required?: boolean;
}

export default function DocumentUpload({
  tenantId,
  documentType,
  onUploadSuccess,
  onUploadError,
  acceptedTypes = ['.pdf', '.jpg', '.jpeg', '.png'],
  maxSizeMB = 10,
  label = 'Upload Document',
  description = 'PDF, JPEG, or PNG (max 10MB)',
  required = false
}: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${maxSizeMB}MB`;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      return `File type must be one of: ${acceptedTypes.join(', ')}`;
    }

    return null;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      setUploadStatus('error');
      setSelectedFile(null);
      if (onUploadError) {
        onUploadError(validationError);
      }
      return;
    }

    setSelectedFile(file);
    setUploadStatus('idle');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadStatus('idle');
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await documentsApi.uploadTenantDocument(
        tenantId,
        selectedFile,
        documentType
      );

      if (response.success) {
        setUploadStatus('success');
        setSuccessMessage('Document uploaded successfully');
        if (onUploadSuccess) {
          onUploadSuccess(response.data);
        }
        // Clear the file after successful upload
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (error: any) {
      const message = error.message || 'Failed to upload document';
      setUploadStatus('error');
      setErrorMessage(message);
      if (onUploadError) {
        onUploadError(message);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setErrorMessage('');
    setSuccessMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor={`file-upload-${documentType}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      {/* File Input */}
      <div className="border-2 border-dashed rounded-lg p-6 text-center">
        <input
          ref={fileInputRef}
          id={`file-upload-${documentType}`}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        {!selectedFile ? (
          <div className="space-y-3">
            <div className="flex justify-center">
              <Upload className="h-12 w-12 text-muted-foreground" />
            </div>
            <div>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                Choose File
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3 p-3 bg-muted rounded-lg">
              <FileText className="h-8 w-8 text-primary" />
              <div className="flex-1 text-left">
                <p className="font-medium text-sm">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Success Message */}
      {uploadStatus === 'success' && successMessage && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          <p className="text-sm">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {uploadStatus === 'error' && errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}
