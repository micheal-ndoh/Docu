'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { FileText, ExternalLink, Edit, Trash2 } from 'lucide-react';
import PDFPreview from '@/components/pdf-preview';
import { useSession } from '@/lib/auth-client';

export default function TemplateDetailPage() {
  const params = useParams() as { id?: string };
  const id = params?.id;
  const router = useRouter();
  const { data: session, isPending } = useSession();

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

  if (loading || isPending) return <div className="p-6">Loading...</div>;
  if (!template) return <div className="p-6">Template not found.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{template.name}</h1>
          <div className="text-sm text-muted-foreground">
            ID: {template.id}
            {session?.user?.name && (
              <span className="ml-4">Created by: {session.user.name}</span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link href={`/templates/${template.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button variant="destructive" onClick={onDelete} disabled={deleting}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            {/* PDF Preview */}
            {Array.isArray(template.documents) && template.documents.length > 0 && (
              <div>
                <h3 className="font-semibold mb-4">Document Preview</h3>
                <PDFPreview
                  url={template.documents[0].url}
                  filename={template.documents[0].filename || template.name}
                />
              </div>
            )}

            <div>
              <h3 className="font-semibold">Documents</h3>
              <ul className="mt-2 space-y-2">
                {Array.isArray(template.documents) &&
                template.documents.length > 0 ? (
                  template.documents.map((d: any) => (
                    <li key={d.id || d.uuid}>
                      <button
                        onClick={() => {
                          const previewElement = document.querySelector('[data-pdf-preview]');
                          if (previewElement) {
                            previewElement.scrollIntoView({ behavior: 'smooth' });
                            // Trigger preview show
                            const previewButton = previewElement.querySelector('button');
                            if (previewButton && !previewButton.textContent?.includes('Hide')) {
                              previewButton.click();
                            }
                          }
                        }}
                        className="text-indigo-600 underline hover:text-indigo-800"
                      >
                        {d.filename || d.name || 'document'}
                      </button>
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
