import { formatChangeType } from '@/lib/ai/generator';
import prisma from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { getDocumentation } from '@/services/documentation/save';
import { notFound, redirect } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CopyMarkdownButton } from './CopyButton';

export default async function DocumentationPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const doc = await getDocumentation(params.id);

  if (!doc) {
    notFound();
  }

  // Buscar la otra versión del mismo commit (Business o Technical)
  const otherVersionType =
    doc.documentType === 'BUSINESS' ? 'TECHNICAL' : 'BUSINESS';
  const otherVersion = await prisma.documentation.findFirst({
    where: {
      repositoryId: doc.repository.id,
      commitSha: doc.commitSha,
      documentType: otherVersionType,
    },
    select: {
      id: true,
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <a
              href="/dashboard"
              className="flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-primary"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Volver al Dashboard
            </a>
            <span className="text-sm text-gray-500">{user.email}</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Meta Info */}
        <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`rounded px-2 py-1 text-xs font-semibold ${
                    doc.documentType === 'BUSINESS'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {doc.documentType === 'BUSINESS'
                    ? 'DOCUMENTO DE NEGOCIO'
                    : 'DOCUMENTO TÉCNICO'}
                </span>
                {otherVersion && (
                  <a
                    href={`/dashboard/docs/${otherVersion.id}`}
                    className="text-xs text-primary hover:underline"
                  >
                    Ver versión{' '}
                    {doc.documentType === 'BUSINESS' ? 'técnica' : 'de negocio'}{' '}
                    →
                  </a>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {doc.commitMessage}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {doc.repository.fullName}
              </p>
            </div>
            <div className="flex gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  doc.type === 'FEATURE'
                    ? 'bg-green-100 text-green-800'
                    : doc.type === 'FIX'
                      ? 'bg-red-100 text-red-800'
                      : doc.type === 'BREAKING'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                }`}
              >
                {formatChangeType(doc.type)}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  doc.impact === 'HIGH'
                    ? 'bg-red-100 text-red-800'
                    : doc.impact === 'MEDIUM'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                }`}
              >
                {doc.impact}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <div className="text-gray-500">Commit</div>
              <div className="font-mono text-gray-900">
                {doc.commitSha.substring(0, 7)}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Autor</div>
              <div className="text-gray-900">{doc.commitAuthor}</div>
            </div>
            <div>
              <div className="text-gray-500">Fecha</div>
              <div className="text-gray-900">
                {new Date(doc.generatedAt).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Formato</div>
              <div className="text-gray-900">{doc.format}</div>
            </div>
          </div>
        </div>

        {/* Documentation Content */}
        <div className="rounded-lg border bg-white p-8 shadow-sm">
          <article className="prose prose-blue max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {doc.content}
            </ReactMarkdown>
          </article>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-4">
          <a
            href={`/api/export/${doc.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            📄 Descargar PDF
          </a>
          <a
            href={`/api/export/${doc.id}/html`}
            download
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            🌐 Descargar HTML
          </a>
          <CopyMarkdownButton content={doc.content} />
        </div>
      </main>
    </div>
  );
}
