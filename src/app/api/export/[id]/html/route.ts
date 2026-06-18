import prisma from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import MarkdownIt from 'markdown-it';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

type DocWithRepo = {
  id: string;
  content: string;
  documentType: string;
  commitSha: string;
  commitMessage: string;
  commitAuthor: string;
  type: string;
  impact: string;
  generatedAt: Date;
  repository: {
    name: string;
    fullName: string;
  };
};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const docId = params.id;

    // Obtener documentación
    const doc = await prisma.documentation.findUnique({
      where: { id: docId },
      include: {
        repository: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!doc) {
      return NextResponse.json(
        { error: 'Documentation not found' },
        { status: 404 }
      );
    }

    // Verificar que el usuario sea dueño del documento
    if (doc.repository.user.email !== user.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Generar HTML standalone
    const html = generateHTMLTemplate(doc);

    // Nombre del archivo
    const fileName = `${doc.repository.name}-${doc.commitSha.substring(0, 7)}-${doc.documentType.toLowerCase()}.html`;

    // Retornar HTML
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('❌ Error generating HTML:', error);
    return NextResponse.json(
      { error: 'Failed to generate HTML' },
      { status: 500 }
    );
  }
}

function generateHTMLTemplate(doc: DocWithRepo): string {
  // Inicializar markdown-it
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
  });

  // Convertir markdown a HTML
  const htmlContent = md.render(doc.content);

  const typeBadge =
    doc.documentType === 'BUSINESS'
      ? '<span class="badge badge-business">BUSINESS</span>'
      : '<span class="badge badge-technical">TECHNICAL</span>';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Documentación - ${doc.repository.name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: linear-gradient(to bottom right, #dbeafe, #ffffff, #ede9fe);
      min-height: 100vh;
      padding: 20px;
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    
    .logo {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .subtitle {
      opacity: 0.9;
      font-size: 14px;
    }
    
    .content-wrapper {
      padding: 40px;
    }
    
    .badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    
    .badge-business {
      background: #3b82f6;
      color: white;
    }
    
    .badge-technical {
      background: #6b7280;
      color: white;
    }
    
    .metadata {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    
    .metadata-grid {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 12px;
    }
    
    .metadata-label {
      font-weight: 600;
      color: #6b7280;
    }
    
    .metadata-value {
      color: #1f2937;
      font-family: 'Courier New', monospace;
      font-size: 14px;
    }
    
    .content {
      margin-top: 30px;
      line-height: 1.8;
    }
    
    .content h1 {
      font-size: 28px;
      color: #1f2937;
      margin: 30px 0 15px 0;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .content h2 {
      font-size: 22px;
      color: #1f2937;
      margin: 25px 0 12px 0;
    }
    
    .content h3 {
      font-size: 18px;
      color: #374151;
      margin: 20px 0 10px 0;
    }
    
    .content h4 {
      font-size: 16px;
      color: #4b5563;
      margin: 15px 0 8px 0;
      font-weight: 600;
    }
    
    .content p {
      margin: 12px 0;
      line-height: 1.8;
    }
    
    .content ul, .content ol {
      margin: 12px 0 12px 30px;
      line-height: 1.8;
    }
    
    .content li {
      margin: 8px 0;
    }
    
    .content strong {
      font-weight: 600;
      color: #111827;
    }
    
    .content em {
      font-style: italic;
      color: #4b5563;
    }
    
    .content code {
      background: #f3f4f6;
      padding: 3px 8px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      color: #dc2626;
      white-space: pre-wrap;
      word-break: break-word;
    }
    
    .content pre {
      background: #1f2937;
      color: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 20px 0;
    }
    
    .content pre code {
      background: none;
      color: #f3f4f6;
      padding: 0;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      line-height: 1.6;
      display: block;
    }
    
    .content blockquote {
      border-left: 4px solid #2563eb;
      padding-left: 15px;
      margin: 15px 0;
      color: #4b5563;
      font-style: italic;
    }
    
    .content table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 14px;
    }
    
    .content thead {
      background: #f9fafb;
    }
    
    .content th {
      background: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      border: 1px solid #d1d5db;
      color: #111827;
    }
    
    .content td {
      padding: 10px 12px;
      border: 1px solid #e5e7eb;
      vertical-align: top;
    }
    
    .content tr:nth-child(even) {
      background: #f9fafb;
    }
    
    .content a {
      color: #2563eb;
      text-decoration: underline;
    }
    
    .content hr {
      border: none;
      border-top: 2px solid #e5e7eb;
      margin: 20px 0;
    }
    
    .footer {
      background: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .container {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">DocuAI</div>
      <div class="subtitle">Documentación Técnica Automática con IA</div>
    </div>
    
    <div class="content-wrapper">
      ${typeBadge}
      
      <div class="metadata">
        <div class="metadata-grid">
          <span class="metadata-label">Repositorio:</span>
          <span class="metadata-value">${doc.repository.fullName}</span>
          
          <span class="metadata-label">Commit SHA:</span>
          <span class="metadata-value">${doc.commitSha.substring(0, 7)}</span>
          
          <span class="metadata-label">Mensaje:</span>
          <span class="metadata-value">${doc.commitMessage}</span>
          
          <span class="metadata-label">Autor:</span>
          <span class="metadata-value">${doc.commitAuthor}</span>
          
          <span class="metadata-label">Tipo:</span>
          <span class="metadata-value">${doc.type}</span>
          
          <span class="metadata-label">Impacto:</span>
          <span class="metadata-value">${doc.impact}</span>
          
          <span class="metadata-label">Generado:</span>
          <span class="metadata-value">${new Date(doc.generatedAt).toLocaleString('es-ES')}</span>
        </div>
      </div>
      
      <div class="content">
        ${htmlContent}
      </div>
    </div>
    
    <div class="footer">
      <p><strong>Documento generado automáticamente por DocuAI</strong></p>
      <p>${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
  </div>
</body>
</html>
  `;
}
