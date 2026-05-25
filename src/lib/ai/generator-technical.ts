import { type CommitAnalysis } from './analyzer';
import { createAnthropicModel, describeAnthropicError } from './config';

interface GenerateTechnicalDocOptions {
  analysis: CommitAnalysis;
  commitSha: string;
  commitMessage: string;
  commitAuthor: string;
  commitDate: string;
  repositoryName: string;
  filesModified: string[];
  filesAdded: string[];
  filesDeleted: string[];
  additions: number;
  deletions: number;
}

/**
 * Genera documentación TÉCNICA formal para desarrolladores
 * - Sin emojis
 * - Detalles técnicos completos
 * - Formato corporativo profesional
 * - Contexto para devs nuevos
 */
export async function generateTechnicalDocumentation(
  options: GenerateTechnicalDocOptions
): Promise<string> {
  const baseDoc = generateBaseTechnicalDoc(options);

  // Intentar mejorar con IA si hay API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      return await enhanceTechnicalDocWithAI(baseDoc, options);
    } catch (error) {
      console.warn(
        'Advertencia: Error mejorando documentación técnica con IA, usando versión base:',
        describeAnthropicError(error)
      );
      return baseDoc;
    }
  }

  return baseDoc;
}

/**
 * Genera documentación base técnica (sin IA)
 */
function generateBaseTechnicalDoc(
  options: GenerateTechnicalDocOptions
): string {
  const {
    analysis,
    commitSha,
    commitMessage,
    commitAuthor,
    commitDate,
    repositoryName,
    filesModified,
    filesAdded,
    filesDeleted,
    additions,
    deletions,
  } = options;

  const typeLabels: Record<string, string> = {
    FEATURE: 'Implementación de Funcionalidad',
    FIX: 'Corrección de Error',
    BREAKING: 'Cambio Incompatible',
    REFACTOR: 'Refactorización',
    DOCS: 'Actualización de Documentación',
    STYLE: 'Cambios de Formato',
    TEST: 'Pruebas',
    CHORE: 'Mantenimiento',
    SKIP: 'Cambio Menor',
  };

  const impactLabels: Record<string, string> = {
    HIGH: 'Alto - Requiere revisión cuidadosa',
    MEDIUM: 'Medio - Revisión estándar',
    LOW: 'Bajo - Cambio menor',
  };

  const typeLabel = typeLabels[analysis.type] || analysis.type;
  const impactLabel = impactLabels[analysis.impact] || analysis.impact;
  const formattedDate = new Date(commitDate).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const totalFiles =
    filesAdded.length + filesModified.length + filesDeleted.length;

  return `# Documentación Técnica de Commit

## Metadatos del Commit

| Campo | Valor |
|-------|-------|
| **SHA** | \`${commitSha}\` |
| **Mensaje** | ${commitMessage} |
| **Autor** | ${commitAuthor} |
| **Fecha** | ${formattedDate} |
| **Repositorio** | ${repositoryName} |

## Clasificación

**Tipo de Cambio:** ${typeLabel}  
**Nivel de Impacto:** ${impactLabel}

${analysis.reasoning ? `**Justificación:** ${analysis.reasoning}` : ''}

## Descripción Técnica

${analysis.summary}

## Cambios Implementados

${analysis.technicalChanges.map((change, index) => `${index + 1}. ${change}`).join('\n')}

## Componentes Afectados

${analysis.affectedAreas.map((area) => `- ${area}`).join('\n')}

## Análisis de Archivos

### Resumen de Cambios

- **Total de archivos modificados:** ${totalFiles}
- **Archivos agregados:** ${filesAdded.length}
- **Archivos modificados:** ${filesModified.length}
- **Archivos eliminados:** ${filesDeleted.length}
- **Líneas agregadas:** +${additions}
- **Líneas eliminadas:** -${deletions}
- **Delta neto:** ${additions - deletions > 0 ? '+' : ''}${additions - deletions} líneas

### Archivos Agregados

${
  filesAdded.length > 0
    ? filesAdded
        .slice(0, 50)
        .map((file) => `- \`${file}\``)
        .join('\n')
    : 'Ninguno'
}

${filesAdded.length > 50 ? `\n*...y ${filesAdded.length - 50} archivos adicionales*\n` : ''}

### Archivos Modificados

${
  filesModified.length > 0
    ? filesModified
        .slice(0, 50)
        .map((file) => `- \`${file}\``)
        .join('\n')
    : 'Ninguno'
}

${filesModified.length > 50 ? `\n*...y ${filesModified.length - 50} archivos adicionales*\n` : ''}

### Archivos Eliminados

${
  filesDeleted.length > 0
    ? filesDeleted
        .slice(0, 50)
        .map((file) => `- \`${file}\``)
        .join('\n')
    : 'Ninguno'
}

${filesDeleted.length > 50 ? `\n*...y ${filesDeleted.length - 50} archivos adicionales*\n` : ''}

## Contexto para Nuevos Desarrolladores

${analysis.functionalDescription}

### Relación con el Sistema

Este cambio afecta las siguientes áreas del sistema: ${analysis.affectedAreas.join(', ')}.

${
  analysis.impact === 'HIGH'
    ? '\n**NOTA IMPORTANTE:** Este cambio tiene un impacto alto. Se recomienda revisar cuidadosamente el código y las pruebas antes de integrar cambios relacionados.\n'
    : analysis.impact === 'MEDIUM'
      ? '\n**NOTA:** Este cambio tiene un impacto medio. Revisar las áreas afectadas antes de trabajar en componentes relacionados.\n'
      : ''
}

## Recomendaciones

${generateRecommendations(analysis, totalFiles)}

---

**Documento generado automáticamente por DocuAI**  
*Sistema de documentación técnica automatizada*  
*Análisis realizado con ${process.env.ANTHROPIC_API_KEY ? 'Claude Sonnet 4' : 'análisis heurístico'}*
`;
}

/**
 * Genera recomendaciones basadas en el análisis
 */
function generateRecommendations(
  analysis: CommitAnalysis,
  totalFiles: number
): string {
  const recommendations: string[] = [];

  if (analysis.impact === 'HIGH') {
    recommendations.push('- Ejecutar suite completa de pruebas antes de merge');
    recommendations.push(
      '- Solicitar revisión de al menos dos desarrolladores'
    );
    recommendations.push('- Verificar impacto en features existentes');
  }

  if (totalFiles > 20) {
    recommendations.push(
      '- Considerar dividir en commits más pequeños en futuras implementaciones'
    );
  }

  if (analysis.type === 'BREAKING') {
    recommendations.push('- Actualizar documentación de API');
    recommendations.push('- Notificar a equipos dependientes del cambio');
    recommendations.push('- Considerar estrategia de migración gradual');
  }

  if (analysis.type === 'REFACTOR') {
    recommendations.push('- Validar que el comportamiento funcional no cambió');
    recommendations.push('- Ejecutar pruebas de regresión');
  }

  if (recommendations.length === 0) {
    recommendations.push('- Revisión estándar de código antes de merge');
    recommendations.push('- Ejecutar pruebas unitarias relevantes');
  }

  return recommendations.join('\n');
}

/**
 * Mejora la documentación técnica usando IA (Claude)
 */
async function enhanceTechnicalDocWithAI(
  baseDoc: string,
  options: GenerateTechnicalDocOptions
): Promise<string> {
  const model = createAnthropicModel();

  const prompt = `Eres un ingeniero senior experto en documentación técnica de software.

Te proporcionaré una documentación técnica base de un commit y debes mejorarla para que sea MÁS ÚTIL para desarrolladores, especialmente para nuevos miembros del equipo.

**Documentación base:**
${baseDoc}

**Contexto adicional:**
- Mensaje del commit: "${options.commitMessage}"
- Archivos clave: ${options.filesModified.slice(0, 10).join(', ')}
- Estadísticas: +${options.additions}/-${options.deletions} líneas

**REGLAS ESTRICTAS:**
1. Mantén el formato Markdown EXACTO (tablas, encabezados, etc.)
2. NO uses emojis
3. USA jerga técnica apropiada (es para desarrolladores)
4. Expande "Descripción Técnica" con más contexto técnico
5. Mejora "Contexto para Nuevos Desarrolladores" con explicaciones detalladas
6. Agrega detalles sobre patrones de diseño o arquitectura si son evidentes
7. En "Recomendaciones", sé específico y práctico
8. Mantén el tono PROFESIONAL y TÉCNICO
9. Escribe en español técnico (puedes usar términos en inglés cuando sea apropiado)
10. NO inventes información que no esté en el contexto

**IMPORTANTE:** Devuelve SOLO el Markdown mejorado, sin explicaciones adicionales ni comentarios.`;

  const response = await model.invoke(prompt);
  const enhanced = response.content.toString();

  console.log('Documentación técnica mejorada con IA');
  return enhanced;
}
