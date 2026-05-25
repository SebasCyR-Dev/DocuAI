import { createAnthropicModel } from './config';
import { type CommitAnalysis } from './analyzer';

interface GenerateDocOptions {
  analysis: CommitAnalysis;
  commitSha: string;
  commitMessage: string;
  commitAuthor: string;
  commitDate: string;
  repositoryName: string;
  filesModified: string[];
}

/**
 * Genera documentación profesional en Markdown basada en el análisis del commit
 */
export async function generateDocumentation(
  options: GenerateDocOptions
): Promise<string> {
  const {
    analysis,
    commitSha,
    commitMessage,
    commitAuthor,
    commitDate,
    repositoryName,
    filesModified,
  } = options;

  // Generar documentación base (siempre funciona, con o sin IA)
  const baseDoc = generateBaseDocumentation(options);

  // Intentar mejorar con IA si hay API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      return await enhanceWithAI(baseDoc, options);
    } catch (error) {
      console.warn(
        '⚠️  Error mejorando doc con IA, usando versión base:',
        error
      );
      return baseDoc;
    }
  }

  return baseDoc;
}

/**
 * Genera documentación base sin IA (siempre funciona)
 */
function generateBaseDocumentation(options: GenerateDocOptions): string {
  const {
    analysis,
    commitSha,
    commitMessage,
    commitAuthor,
    commitDate,
    repositoryName,
    filesModified,
  } = options;

  const typeEmojis: Record<string, string> = {
    FEATURE: '✨',
    FIX: '🐛',
    BREAKING: '💥',
    REFACTOR: '♻️',
    DOCS: '📝',
    STYLE: '💄',
    TEST: '✅',
    CHORE: '🔧',
    SKIP: '⏭️',
  };

  const impactLabels: Record<string, string> = {
    HIGH: '🔴 Alto',
    MEDIUM: '🟡 Medio',
    LOW: '🟢 Bajo',
  };

  const emoji = typeEmojis[analysis.type] || '📦';
  const impactLabel = impactLabels[analysis.impact] || analysis.impact;

  return `# ${emoji} ${commitMessage}

**Tipo:** ${analysis.type} | **Impacto:** ${impactLabel}  
**Commit:** \`${commitSha.substring(0, 7)}\` | **Autor:** ${commitAuthor}  
**Fecha:** ${new Date(commitDate).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}  
**Repositorio:** ${repositoryName}

---

## 📝 Resumen

${analysis.summary}

${analysis.reasoning ? `\n**Análisis:** ${analysis.reasoning}\n` : ''}

---

## 🔧 Cambios Técnicos

${analysis.technicalChanges.map((change) => `- ${change}`).join('\n')}

---

## 📂 Áreas Afectadas

${analysis.affectedAreas.map((area) => `- **${area}**`).join('\n')}

---

## 📄 Archivos Modificados

${
  filesModified.length > 0
    ? filesModified
        .slice(0, 20)
        .map((file) => `- \`${file}\``)
        .join('\n')
    : 'Sin información de archivos'
}

${filesModified.length > 20 ? `\n*... y ${filesModified.length - 20} archivos más*\n` : ''}

---

## 📊 Estadísticas

- **Archivos modificados:** ${filesModified.length}
- **Tipo de cambio:** ${analysis.type}
- **Nivel de impacto:** ${analysis.impact}

---

<div style="text-align: center; color: #666; margin-top: 2rem;">
  <p><em>Documentación generada automáticamente por DocuAI 🤖</em></p>
  <p style="font-size: 0.875rem;">Analizado con ${process.env.ANTHROPIC_API_KEY ? 'Claude Sonnet 4' : 'análisis automático'}</p>
</div>
`;
}

/**
 * Mejora la documentación usando IA (Claude)
 */
async function enhanceWithAI(
  baseDoc: string,
  options: GenerateDocOptions
): Promise<string> {
  const model = createAnthropicModel({
    modelName: 'claude-sonnet-4-20250514',
  });

  const prompt = `Eres un asistente técnico experto en documentación de software. 

Te proporcionaré una documentación base de un commit y debes mejorarla haciéndola más profesional, clara y útil.

**Documentación base:**
${baseDoc}

**Contexto adicional:**
- Mensaje del commit: "${options.commitMessage}"
- Archivos modificados: ${options.filesModified.slice(0, 5).join(', ')}

**Instrucciones:**
1. Mantén la estructura Markdown exacta (no cambies los encabezados)
2. Mejora la redacción del resumen haciéndolo más claro y profesional
3. Expande los cambios técnicos con más detalle si es posible
4. Agrega contexto sobre por qué este cambio es importante
5. Mantén el tono profesional pero accesible
6. Escribe en español
7. NO inventes información que no esté en el contexto
8. Mantén los emojis y el formato actual

**IMPORTANTE:** Devuelve SOLO el Markdown mejorado, sin explicaciones adicionales.`;

  const response = await model.invoke(prompt);
  const enhanced = response.content.toString();

  console.log('✨ Documentación mejorada con IA');
  return enhanced;
}

/**
 * Convierte el tipo de cambio a formato legible
 */
export function formatChangeType(type: string): string {
  const labels: Record<string, string> = {
    FEATURE: 'Nueva Funcionalidad',
    FIX: 'Corrección de Bug',
    BREAKING: 'Cambio que Rompe Compatibilidad',
    REFACTOR: 'Refactorización',
    DOCS: 'Documentación',
    STYLE: 'Estilo/Formato',
    TEST: 'Tests',
    CHORE: 'Mantenimiento',
    SKIP: 'Sin Cambios Relevantes',
  };

  return labels[type] || type;
}

/**
 * Genera un extracto corto de la documentación
 */
export function generateExcerpt(
  markdown: string,
  maxLength: number = 200
): string {
  // Extraer el primer párrafo después del resumen
  const lines = markdown.split('\n');
  const summaryIndex = lines.findIndex((line) =>
    line.includes('## 📝 Resumen')
  );

  if (summaryIndex === -1) {
    return markdown.substring(0, maxLength).trim() + '...';
  }

  // Tomar las siguientes líneas no vacías
  let excerpt = '';
  for (let i = summaryIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('#') && !line.startsWith('---')) {
      excerpt += line + ' ';
      if (excerpt.length >= maxLength) break;
    }
  }

  return excerpt.substring(0, maxLength).trim() + '...';
}
