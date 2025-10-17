'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { FileText, ExternalLink, Edit, Trash2 } from 'lucide-react';

export default function TemplateDetailPage() {
  const params = useParams() as { id?: string };
  const id = params?.id;
  const router = useRouter();

  const [template, setTemplate] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchTemplate();
  }, [id]);

  const fetchTemplate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/docuseal/templates/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          toast.error('Template not found');
          setTemplate(null);
          return;
        }
        const text = await res.text();
        throw new Error(text || 'Failed to load template');
      }
      const payload = await res.json();
      const templateData = payload?.data ?? payload;
      setTemplate(templateData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error('Error loading template: ' + message);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!confirm('Delete this template?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/docuseal/templates/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || 'Delete failed');
      }
      toast.success('Template deleted');
      router.push('/templates');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error('Delete failed: ' + message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!template) return <div className="p-6">Template not found.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{template.name}</h1>
          <div className="text-sm text-muted-foreground">ID: {template.id}</div>
        </div>
        <div className="flex items-center space-x-2">
          <Link href={`/templates/${template.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          {template.documents && template.documents.length > 0 && (
            <Link href={template.documents[0].url || '#'} target="_blank">
              <Button variant="outline">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Document
              </Button>
            </Link>
          )}
          <Button variant="destructive" onClick={onDelete} disabled={deleting}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 flex items-center justify-center rounded bg-muted">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <div className="font-medium">{template.name}</div>
                <div className="text-sm text-muted-foreground">
                  {template.preview_description ?? ''}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold">Documents</h3>
              <ul className="mt-2 space-y-2">
                {Array.isArray(template.documents) &&
                template.documents.length > 0 ? (
                  template.documents.map((d: any) => (
                    <li key={d.id || d.uuid}>
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 underline"
                      >
                        {d.filename || d.name || 'document'}
                      </a>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-muted-foreground">
                    No documents
                  </li>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
