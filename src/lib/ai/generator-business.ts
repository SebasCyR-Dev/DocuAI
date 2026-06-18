import { type CommitAnalysis } from './analyzer';
import { createAnthropicModel, describeAnthropicError } from './config';

interface GenerateBusinessDocOptions {
  analysis: CommitAnalysis;
  commitSha: string;
  commitMessage: string;
  commitAuthor: string;
  commitDate: string;
  repositoryName: string;
  filesModified: string[];
}

/**
 * Genera documentación de NEGOCIO formal para clientes/PM/stakeholders
 * - Sin emojis
 * - Lenguaje simple y claro
 * - Enfoque en valor de negocio
 * - Formato corporativo profesional
 */
export async function generateBusinessDocumentation(
  options: GenerateBusinessDocOptions
): Promise<string> {
  const baseDoc = generateBaseBusinessDoc(options);

  // Intentar mejorar con IA si hay API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      return await enhanceBusinessDocWithAI(baseDoc, options);
    } catch (error) {
      console.warn(
        'Advertencia: Error mejorando documentación de negocio con IA, usando versión base:',
        describeAnthropicError(error)
      );
      return baseDoc;
    }
  }

  return baseDoc;
}

/**
 * Genera documentación base de negocio (sin IA)
 */
function generateBaseBusinessDoc(options: GenerateBusinessDocOptions): string {
  const {
    analysis,
    commitSha,
    commitMessage,
    commitAuthor,
    commitDate,
    repositoryName,
  } = options;

  const typeLabels: Record<string, string> = {
    FEATURE: 'Nueva Funcionalidad',
    FIX: 'Corrección',
    BREAKING: 'Cambio Importante',
    REFACTOR: 'Mejora Interna',
    DOCS: 'Documentación',
    STYLE: 'Ajuste de Presentación',
    TEST: 'Validación',
    CHORE: 'Mantenimiento',
    SKIP: 'Actualización Menor',
  };

  const impactLabels: Record<string, string> = {
    HIGH: 'Alto',
    MEDIUM: 'Medio',
    LOW: 'Bajo',
  };

  const typeLabel = typeLabels[analysis.type] || analysis.type;
  const impactLabel = impactLabels[analysis.impact] || analysis.impact;
  const formattedDate = new Date(commitDate).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `# Informe de Cambios

## Información General

- **Proyecto:** ${repositoryName}
- **Fecha:** ${formattedDate}
- **Responsable:** ${commitAuthor}
- **Referencia:** ${commitSha.substring(0, 7)}

## Resumen Ejecutivo

${analysis.businessImpact}

## Descripción Funcional

${analysis.functionalDescription}

## Impacto en el Negocio

- **Clasificación:** ${typeLabel}  
- **Nivel de Impacto:** ${impactLabel}

${analysis.businessValue}

## Cambios Visibles para Usuarios

${
  analysis.userFacingChanges.length > 0
    ? analysis.userFacingChanges.map((change) => `- ${change}`).join('\n')
    : 'Este cambio no incluye modificaciones visibles para los usuarios finales. Se trata de mejoras internas que contribuyen a la calidad y mantenibilidad del sistema.'
}

## Áreas del Sistema Afectadas

${analysis.affectedAreas.map((area) => `- ${area}`).join('\n')}

## Notas Adicionales

${analysis.reasoning || 'Cambio implementado siguiendo las mejores prácticas de desarrollo de software.'}

---

**Documento generado automáticamente por DocuAI**  
*Sistema de documentación técnica automatizada*
`;
}

/**
 * Mejora la documentación de negocio usando IA (Claude)
 */
async function enhanceBusinessDocWithAI(
  baseDoc: string,
  options: GenerateBusinessDocOptions
): Promise<string> {
  const model = createAnthropicModel();

  const prompt = `Eres un analista de negocio experto en comunicación corporativa. 

Te proporcionaré un informe de cambios técnicos y debes mejorarlo para que sea COMPLETAMENTE COMPRENSIBLE para personas NO TÉCNICAS (clientes, gerentes, product managers).

**Informe base:**
${baseDoc}

**Contexto adicional:**
- Mensaje del commit: "${options.commitMessage}"
- Archivos afectados: ${options.filesModified.slice(0, 5).join(', ')}

**REGLAS ESTRICTAS:**
1. Mantén el formato Markdown EXACTO (no cambies encabezados)
2. NO uses emojis en NINGUNA parte
3. NO uses jerga técnica (evita términos como: API, endpoint, refactor, deploy, etc.)
4. Usa lenguaje SIMPLE y CLARO como si explicaras a un cliente no técnico
5. Enfócate en QUÉ cambió y POR QUÉ importa, NO en CÓMO está implementado
6. Expande la "Descripción Funcional" con ejemplos concretos si es posible
7. Mejora el "Impacto en el Negocio" haciéndolo más tangible
8. Mantén el tono PROFESIONAL y CORPORATIVO
9. Escribe en español formal
10. NO inventes información que no esté en el contexto

**EJEMPLO DE TONO CORRECTO:**
- MAL: "Se implementó un nuevo hook de React para manejar el estado del carrito"
- BIEN: "Se mejoró el sistema de carrito de compras para que los cambios se guarden automáticamente"

**IMPORTANTE:** Devuelve SOLO el Markdown mejorado, sin explicaciones adicionales ni comentarios.`;

  const response = await model.invoke(prompt);
  const enhanced = response.content.toString();

  console.log('Documentación de negocio mejorada con IA');
  return enhanced;
}
