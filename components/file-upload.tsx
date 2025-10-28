'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Upload, File, AlertCircle, CheckCircle, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onUploadComplete?: (result: UploadResult) => void;
  onUploadError?: (error: string) => void;
  className?: string;
}

interface UploadResult {
  fileId: string;
  uploadId: number;
  originalName: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  processResult: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    hasErrors: boolean;
    errors?: string[];
  };
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  result?: UploadResult;
}

export function FileUpload({ onUploadComplete, onUploadError, className }: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [dataType, setDataType] = useState<'security_log' | 'compatibility_data'>('security_log');
  const [description, setDescription] = useState('');

  const uploadFile = async (file: File, fileIndex: number) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dataType', dataType);
    formData.append('description', description);

    try {
      // Update status to processing
      setUploadingFiles(prev => 
        prev.map((f, i) => 
          i === fileIndex ? { ...f, status: 'processing', progress: 50 } : f
        )
      );

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // Update status to completed
      setUploadingFiles(prev => 
        prev.map((f, i) => 
          i === fileIndex 
            ? { 
                ...f, 
                status: 'completed', 
                progress: 100, 
                result: result.data 
              } 
            : f
        )
      );

      onUploadComplete?.(result.data);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      // Update status to error
      setUploadingFiles(prev => 
        prev.map((f, i) => 
          i === fileIndex 
            ? { 
                ...f, 
                status: 'error', 
                error: errorMessage 
              } 
            : f
        )
      );

      onUploadError?.(errorMessage);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newUploadingFiles = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const,
    }));

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      const fileIndex = uploadingFiles.length + i;

      try {
        await uploadFile(file, fileIndex);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
  }, [uploadingFiles.length, dataType, description]);

  const removeFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
      'text/csv': ['.csv'],
      'application/csv': ['.csv'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn('space-y-6', className)}>
      <Card>
        <CardHeader>
          <CardTitle>Upload Security Logs</CardTitle>
          <CardDescription>
            Upload JSON or CSV files containing security tool logs or compatibility data.
            Maximum file size: 50MB
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Data Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Data Type</Label>
            <RadioGroup
              value={dataType}
              onValueChange={(value) => setDataType(value as 'security_log' | 'compatibility_data')}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="security_log" id="security_log" />
                <Label htmlFor="security_log" className="text-sm">
                  Security Tool Logs
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="compatibility_data" id="compatibility_data" />
                <Label htmlFor="compatibility_data" className="text-sm">
                  Compatibility Data
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Description (Optional)</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the uploaded data..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          {/* Drop Zone */}
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              isDragActive && !isDragReject && 'border-blue-500 bg-blue-50',
              isDragReject && 'border-red-500 bg-red-50',
              !isDragActive && 'border-gray-300 hover:border-gray-400'
            )}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-700">
                {isDragActive
                  ? isDragReject
                    ? 'Invalid file type'
                    : 'Drop files here'
                  : 'Drop files here or click to browse'
                }
              </p>
              <p className="text-sm text-gray-500">
                Supports JSON and CSV files up to 50MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadingFiles.map((uploadingFile, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <File className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {uploadingFile.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(uploadingFile.file.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {uploadingFile.status === 'uploading' && (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      )}
                      {uploadingFile.status === 'processing' && (
                        <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
                      )}
                      {uploadingFile.status === 'completed' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {uploadingFile.status === 'error' && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {uploadingFile.status !== 'completed' && uploadingFile.status !== 'error' && (
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadingFile.progress}%` }}
                      />
                    </div>
                  )}

                  {/* Status Message */}
                  <div className="text-xs text-gray-600">
                    {uploadingFile.status === 'uploading' && 'Uploading...'}
                    {uploadingFile.status === 'processing' && 'Processing file...'}
                    {uploadingFile.status === 'completed' && uploadingFile.result && (
                      <div className="space-y-1">
                        <p className="text-green-600 font-medium">Upload completed successfully!</p>
                        <p>Total rows: {uploadingFile.result.processResult.totalRows}</p>
                        <p>Valid rows: {uploadingFile.result.processResult.validRows}</p>
                        {uploadingFile.result.processResult.invalidRows > 0 && (
                          <p className="text-yellow-600">
                            Invalid rows: {uploadingFile.result.processResult.invalidRows}
                          </p>
                        )}
                        {uploadingFile.result.processResult.hasErrors && (
                          <div className="mt-2">
                            <p className="text-red-600 font-medium">Validation Issues:</p>
                            <ul className="text-red-600 text-xs list-disc list-inside">
                              {uploadingFile.result.processResult.errors?.slice(0, 3).map((error, idx) => (
                                <li key={idx}>{error}</li>
                              ))}
                              {uploadingFile.result.processResult.errors && 
                               uploadingFile.result.processResult.errors.length > 3 && (
                                <li>...and {uploadingFile.result.processResult.errors.length - 3} more</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    {uploadingFile.status === 'error' && (
                      <p className="text-red-600 font-medium">
                        Error: {uploadingFile.error}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
