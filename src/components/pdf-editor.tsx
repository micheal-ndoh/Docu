'use client';

import { useState, useEffect } from 'react';
import { DocusealBuilder } from '@docuseal/react';

interface DocusealEditorProps {
  templateId?: number;
}

const DocusealEditor = ({ templateId }: DocusealEditorProps) => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch('/api/docuseal/builder_token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ template_id: templateId }),
        });
        const data = await response.json();
        setToken(data.token);
      } catch (error) {
        console.error('Failed to fetch token:', error);
      }
    };

    fetchToken();
  }, [templateId]);

  return token ? <DocusealBuilder token={token} /> : <div>Loading...</div>;
};

export default DocusealEditor;
