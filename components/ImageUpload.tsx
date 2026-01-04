'use client';

import { useState } from 'react';
import { UploadButton, UploadDropzone } from '@uploadthing/react';
import { OurFileRouter } from '@/lib/uploadthing';
import { X, Upload } from 'lucide-react';

interface ImageUploadProps {
  value?: string | string[];
  onChange: (url: string | string[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  multiple = false,
  maxFiles = 10,
  className = '',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentImages = Array.isArray(value) ? value : (value ? [value] : []);

  const handleUploadComplete = (res: { url: string }[]) => {
    setUploading(false);
    setError(null);
    
    if (res && res.length > 0) {
      const urls = res.map((file) => file.url);
      
      if (multiple) {
        const newUrls = [...currentImages, ...urls];
        onChange(newUrls.slice(0, maxFiles));
      } else {
        onChange(urls[0]);
      }
    }
  };

  const handleUploadError = (error: Error) => {
    setUploading(false);
    setError(error.message || 'Upload failed. Please try again.');
  };

  const removeImage = (index: number) => {
    if (multiple && Array.isArray(value)) {
      const newUrls = value.filter((_, i) => i !== index);
      onChange(newUrls);
    } else {
      onChange('');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Display current images */}
      {currentImages.length > 0 && (
        <div className={`grid gap-4 ${multiple ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}>
          {currentImages.map((url, index) => (
            <div key={index} className="relative group">
              <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={url}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload component */}
      <div className="space-y-2">
        {multiple ? (
          <UploadDropzone<OurFileRouter, 'multipleImageUploader'>
            endpoint="multipleImageUploader"
            onClientUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            onUploadBegin={() => {
              setUploading(true);
              setError(null);
            }}
            config={{
              mode: 'auto',
            }}
            appearance={{
              container: 'ut-flex ut-flex-col ut-items-center ut-justify-center ut-border-2 ut-border-dashed ut-border-gray-300 ut-rounded-lg ut-p-8 ut-bg-gray-50 hover:ut-bg-gray-100 ut-transition-colors',
              allowedContent: 'ut-text-sm ut-text-gray-500',
              button: 'ut-bg-emerald-600 ut-text-white ut-px-4 ut-py-2 ut-rounded-md hover:ut-bg-emerald-700 ut-transition-colors',
            }}
          />
        ) : (
          <UploadButton<OurFileRouter, 'imageUploader'>
            endpoint="imageUploader"
            onClientUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            onUploadBegin={() => {
              setUploading(true);
              setError(null);
            }}
            appearance={{
              allowedContent: 'ut-text-sm ut-text-gray-500',
              button: 'ut-bg-emerald-600 ut-text-white ut-px-4 ut-py-2 ut-rounded-md hover:ut-bg-emerald-700 ut-transition-colors',
            }}
          />
        )}
        
        {uploading && (
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <Upload className="w-4 h-4 animate-pulse" />
            Uploading...
          </p>
        )}
        
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* Manual URL input as fallback */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Or enter image URL manually
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://example.com/image.jpg"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            onBlur={(e) => {
              const url = e.target.value.trim();
              if (url) {
                if (multiple) {
                  onChange([...currentImages, url]);
                } else {
                  onChange(url);
                }
                e.target.value = '';
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const url = (e.target as HTMLInputElement).value.trim();
                if (url) {
                  if (multiple) {
                    onChange([...currentImages, url]);
                  } else {
                    onChange(url);
                  }
                  (e.target as HTMLInputElement).value = '';
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

