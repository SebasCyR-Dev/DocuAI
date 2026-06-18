import prisma from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import MarkdownIt from 'markdown-it';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

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

    // Generar HTML para el PDF
    const html = generatePDFTemplate(doc);

    // Generar PDF con Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
      printBackground: true,
    });

    await browser.close();

    // Nombre del archivo
    const fileName = `${doc.repository.name}-${doc.commitSha.substring(0, 7)}-${doc.documentType.toLowerCase()}.pdf`;

    // Retornar PDF
    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

function generatePDFTemplate(doc: DocWithRepo): string {
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
      ? '<span style="background: #3b82f6; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600;">BUSINESS</span>'
      : '<span style="background: #6b7280; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600;">TECHNICAL</span>';

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
      background: white;
      font-size: 11pt;
    }
    
    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .logo {
      font-size: 24pt;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 8px;
    }
    
    .logo-accent {
      color: #2563eb;
    }
    
    .subtitle {
      color: #6b7280;
      font-size: 11pt;
    }
    
    .metadata {
      background: #f3f4f6;
      padding: 15px;
      border-radius: 6px;
      margin: 20px 0;
      border-left: 4px solid #2563eb;
    }
    
    .metadata-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .metadata-row:last-child {
      border-bottom: none;
    }
    
    .metadata-label {
      font-weight: 600;
      color: #4b5563;
      min-width: 120px;
    }
    
    .metadata-value {
      color: #1f2937;
      text-align: right;
      font-family: 'Courier New', monospace;
      font-size: 10pt;
    }
    
    .content {
      margin-top: 30px;
      line-height: 1.8;
    }
    
    .content h1 {
      font-size: 20pt;
      color: #1f2937;
      margin: 25px 0 15px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
      page-break-after: avoid;
    }
    
    .content h2 {
      font-size: 16pt;
      color: #1f2937;
      margin: 20px 0 12px 0;
      page-break-after: avoid;
    }
    
    .content h3 {
      font-size: 13pt;
      color: #374151;
      margin: 15px 0 10px 0;
      page-break-after: avoid;
    }
    
    .content h4 {
      font-size: 11pt;
      color: #4b5563;
      margin: 12px 0 8px 0;
      font-weight: 600;
    }
    
    .content p {
      margin: 10px 0;
      text-align: justify;
      line-height: 1.7;
    }
    
    .content ul, .content ol {
      margin: 10px 0 10px 25px;
      line-height: 1.8;
    }
    
    .content li {
      margin: 6px 0;
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
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 9pt;
      color: #dc2626;
      white-space: pre-wrap;
      word-break: break-word;
    }
    
    .content pre {
      background: #1f2937;
      color: #f3f4f6;
      padding: 15px;
      border-radius: 6px;
      overflow-x: auto;
      margin: 15px 0;
      page-break-inside: avoid;
    }
    
    .content pre code {
      background: none;
      color: #f3f4f6;
      padding: 0;
      font-family: 'Courier New', monospace;
      font-size: 9pt;
      line-height: 1.5;
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
      font-size: 10pt;
      page-break-inside: avoid;
    }
    
    .content thead {
      background: #f9fafb;
    }
    
    .content th {
      background: #f3f4f6;
      padding: 10px;
      text-align: left;
      font-weight: 600;
      border: 1px solid #d1d5db;
      color: #111827;
    }
    
    .content td {
      padding: 8px 10px;
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
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 9pt;
    }
    
    .page-break {
      page-break-after: always;
    }
    
    @media print {
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Docu<span class="logo-accent">AI</span></div>
    <div class="subtitle">Documentación Técnica Automática con IA</div>
  </div>
  
  <div style="margin: 20px 0;">
    ${typeBadge}
  </div>
  
  <div class="metadata">
    <div class="metadata-row">
      <span class="metadata-label">Repositorio:</span>
      <span class="metadata-value">${doc.repository.fullName}</span>
    </div>
    <div class="metadata-row">
      <span class="metadata-label">Commit SHA:</span>
      <span class="metadata-value">${doc.commitSha.substring(0, 7)}</span>
    </div>
    <div class="metadata-row">
      <span class="metadata-label">Mensaje:</span>
      <span class="metadata-value">${doc.commitMessage}</span>
    </div>
    <div class="metadata-row">
      <span class="metadata-label">Autor:</span>
      <span class="metadata-value">${doc.commitAuthor}</span>
    </div>
    <div class="metadata-row">
      <span class="metadata-label">Tipo:</span>
      <span class="metadata-value">${doc.type}</span>
    </div>
    <div class="metadata-row">
      <span class="metadata-label">Impacto:</span>
      <span class="metadata-value">${doc.impact}</span>
    </div>
    <div class="metadata-row">
      <span class="metadata-label">Generado:</span>
      <span class="metadata-value">${new Date(doc.generatedAt).toLocaleString('es-ES')}</span>
    </div>
  </div>
  
  <div class="content">
    ${htmlContent}
  </div>
  
  <div class="footer">
    <p>Documento generado automáticamente por DocuAI</p>
    <p>${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>
</body>
</html>
  `;
}
