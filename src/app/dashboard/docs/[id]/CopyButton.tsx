'use client';

import { useState } from 'react';

export function CopyMarkdownButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copiando:', error);
      alert('Error al copiar. Intenta de nuevo.');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
    >
      {copied ? 'Copiado' : 'Copiar Markdown'}
    </button>
  );
}
