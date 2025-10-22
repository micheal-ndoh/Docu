'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import DocusealEditor from '@/components/pdf-editor';
import { toast } from 'sonner';

export default function EditTemplatePage() {
  const params = useParams() as { id: string };
  const id = params?.id;
  const router = useRouter();

  const handleSave = async () => {
    try {
      // The DocuSeal editor handles saving internally
      // We can show a success message and redirect
      toast.success('Template saved successfully!');
      router.push(`/templates/${id}`);
    } catch (error) {
      toast.error('Failed to save template');
      console.error('Save error:', error);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Header with Save Button */}
      <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-900">
        <div className="flex items-center space-x-4">
          <Link href={`/templates/${id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Template
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold">Edit Template</h1>
            <p className="text-sm text-muted-foreground">ID: {id}</p>
          </div>
        </div>
        <Button onClick={handleSave} className="flex items-center space-x-2">
          <Save className="h-4 w-4" />
          <span>Save Template</span>
        </Button>
      </div>

      {/* Editor */}
      <div className="flex-1">
        <DocusealEditor templateId={Number(id)} />
      </div>
    </div>
  );
}
