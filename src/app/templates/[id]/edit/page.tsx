'use client';

import { useParams } from 'next/navigation';
import DocusealEditor from '@/components/pdf-editor';

export default function EditTemplatePage() {
  const params = useParams() as { id: string };
  const id = params?.id;

  return (
    <div className="w-full h-screen">
      <DocusealEditor templateId={Number(id)} />
    </div>
  );
}
