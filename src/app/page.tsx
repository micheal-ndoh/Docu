'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Menu,
  LayoutGrid,
  Upload,
  User,
  Calendar,
  MoreVertical,
  ExternalLink,
  Edit,
  Download,
  Trash2,
  Loader2,
} from 'lucide-react';
import { DashboardSkeleton } from '@/components/loading-skeletons';

export default function HomePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [templates, setTemplates] = useState<
    {
      id: string | number;
      name: string;
      // author can be a simple string or an object returned by the API
      author?:
        | string
        | {
            first_name?: string;
            last_name?: string;
            name?: string;
            email?: string;
            [key: string]: unknown;
          };
      date?: string;
    }[]
  >([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch('/api/docuseal/templates');
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to fetch templates');
      }
      const data = await res.json();
      // Accept multiple possible shapes returned by the proxy or DocuSeal API:
      // - direct array: [{...}, ...]
      // - { data: [...] }
      // - { templates: [...] }
      // - { items: [...] }
      let list: any[] = [];
      if (Array.isArray(data)) list = data;
      else if (Array.isArray(data?.data)) list = data.data;
      else if (Array.isArray(data?.templates)) list = data.templates;
      else if (Array.isArray(data?.items)) list = data.items;
      else list = [];
      setTemplates(list);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error('Unable to load templates: ' + message);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const onDeleteTemplate = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    const original = templates;
    setTemplates((prev) => prev.filter((t) => String(t.id) !== String(id)));
    try {
      const res = await fetch(`/api/docuseal/templates/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || 'Delete failed');
      }
      toast.success('Template deleted');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error('Delete failed: ' + message);
      setTemplates(original);
    }
  };

  const onDownloadTemplate = async (template: any) => {
    const doc = Array.isArray(template.documents) && template.documents.length > 0
      ? template.documents[0]
      : null;

    if (!doc || !doc.url) {
      toast.error('No downloadable document found for this template.');
      return;
    }

    try {
      const res = await fetch(doc.url);
      if (!res.ok) {
        throw new Error('Failed to fetch the document for download.');
      }
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = doc.filename || template.name || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
      toast.success('Download started.');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Download failed: ${message}`);
    }
  };

  const onUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading('Uploading document and creating template...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/docuseal/templates/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const newTemplate = await res.json();
      toast.success('Template created successfully! Redirecting to editor...', { id: toastId });

      router.push(`/templates/${newTemplate.id}/edit`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Upload failed: ${message}`, { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (isPending) {
    return <DashboardSkeleton />;
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="mx-auto max-w-md text-center">
          <div className="mb-8 flex justify-center">
            <span className="text-6xl">🐵</span>
          </div>
          <h1 className="mb-4 text-3xl font-bold tracking-tight">
            Welcome to DocuSeal App
          </h1>
          <p className="mb-8 text-muted-foreground">
            Create, manage, and track your document templates and submissions
            with ease.
          </p>
          <div className="space-y-4">
            <Link href="/auth/signin">
              <Button size="lg" className="w-full">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="outline" size="lg" className="w-full">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // templates loaded from API into state

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Navigation and Header */}
      <div className="sticky top-16 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Navigation Boxes */}
              <div className="flex items-center space-x-1">
                {/* Document Templates Box (Always active since it's current page) */}
                <div className="flex items-center space-x-2 rounded-lg px-3 py-2 bg-black text-white dark:bg-white dark:text-black">
                  <LayoutGrid className="h-4 w-4" />
                  <span className="text-xs font-medium">{templates.length}</span>
                </div>
                
                {/* Submissions Box */}
                <Link href="/submissions">
                  <div className="flex items-center space-x-2 rounded-lg px-3 py-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                    <Menu className="h-4 w-4" />
                  </div>
                </Link>
              </div>
              {/* Title */}
              <h1 className="text-2xl font-bold">Document Templates</h1>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={onUpload}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.bmp"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {isUploading ? 'UPLOADING...' : 'UPLOAD'}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">

        {/* Templates Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {(loadingTemplates ? [] : templates).map((template) => (
            <Card
              key={template.id}
              className="group cursor-pointer transition-all hover:shadow-md"
            >
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/templates/${template.id}`}
                          className="flex items-center"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/templates/${template.id}/edit`}
                          className="flex items-center"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => onDownloadTemplate(template)}
                        className="flex items-center"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => onDeleteTemplate(template.id)}
                        className="flex items-center text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <h3 className="mb-2 font-semibold text-foreground line-clamp-2">
                  <Link href={`/templates/${template.id}`} className="block">
                    {template.name}
                  </Link>
                </h3>

                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>
                    {typeof template.author === 'string'
                      ? template.author
                      : template.author && typeof template.author === 'object'
                      ? template.author.first_name || template.author.name
                        ? `${template.author.first_name ?? ''} ${
                            template.author.last_name ?? ''
                          }`.trim() || template.author.name
                        : template.author.email ??
                          JSON.stringify(template.author)
                      : 'Unknown'}
                  </span>
                </div>

                <div className="mt-2 flex items-center space-x-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{template.date}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Upload Section */}
        <div className="mb-8 flex justify-center">
          <Card className="w-full max-w-md border-2 border-dashed border-muted-foreground/25 bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <h3 className="mb-2 font-semibold">Upload a New Document</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Click to upload or drag and drop
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Choose File
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
