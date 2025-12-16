'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink, Eye, EyeOff } from 'lucide-react';

interface PDFPreviewProps {
  url: string;
  filename?: string;
}

export default function PDFPreview({ url, filename }: PDFPreviewProps) {
  const [isClient, setIsClient] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-white dark:bg-gray-900" data-pdf-preview>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">{filename || 'Document'}</p>
              <p className="text-xs text-muted-foreground">PDF Document</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center space-x-1"
            >
              {showPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              <span>{showPreview ? 'Hide' : 'Preview'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(true)}
              className="flex items-center space-x-1"
            >
              <FileText className="h-3 w-3" />
              <span>Open</span>
            </Button>
          </div>
        </div>
      </div>

      {showPreview && (
        <div className="p-4">
          <div className="w-full h-[800px] border rounded">
            <iframe
              src={url}
              className="w-full h-full rounded"
              title={filename || 'PDF Document'}
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}