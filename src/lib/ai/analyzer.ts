import { ChangeType, Impact } from '@prisma/client';
import { z } from 'zod';
import {
  formatDiffForPrompt,
  type HydratedCommit,
} from '../github/fetch-commit';
import { createAnthropicModel, describeAnthropicError } from './config';

// Schema de validación para el análisis técnico.
// Estrategia: validar SHAPE (tipos, requeridos, enums), no longitudes — esas
// las saneamos manualmente con sanitizeAnalysis() antes de validar. Así, si
// Claude se pasa de largo en algún campo, truncamos en lugar de caer al
// fallback heurístico (que produce docs genéricas).
const AnalysisSchema = z.object({
  type: z.nativeEnum(ChangeType),
  impact: z.nativeEnum(Impact),
  summary: z.string().min(10),
  technicalChanges: z.array(z.string()).min(1).max(10),
  affectedAreas: z.array(z.string()).min(1).max(5),
  reasoning: z.string().optional(),
  businessImpact: z.string().min(10),
  userFacingChanges: z.array(z.string()).max(10),
  businessValue: z.string().min(10),
  functionalDescription: z.string().min(10),
});

const FIELD_CAPS: Record<string, number> = {
  summary: 500,
  reasoning: 1000,
  businessImpact: 1500,
  businessValue: 1500,
  functionalDescription: 3000,
};
const ARRAY_ITEM_CAP = 400;

function truncate(s: unknown, max: number): unknown {
  if (typeof s !== 'string') return s;
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

/**
 * Trunca cualquier string que se haya pasado del techo razonable ANTES
 * de validar con Zod, para evitar caer al fallback heurístico por verbosidad.
 */
function sanitizeAnalysis(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const obj = { ...(raw as Record<string, unknown>) };
  for (const [field, max] of Object.entries(FIELD_CAPS)) {
    if (field in obj) obj[field] = truncate(obj[field], max);
  }
  for (const arrField of [
    'technicalChanges',
    'affectedAreas',
    'userFacingChanges',
  ]) {
    const arr = obj[arrField];
    if (Array.isArray(arr)) {
      obj[arrField] = arr.map((item) => truncate(item, ARRAY_ITEM_CAP));
    }
  }
  return obj;
}

export type CommitAnalysis = z.infer<typeof AnalysisSchema>;

interface AnalyzeCommitParams {
  message: string;
  author: string;
  filesAdded: string[];
  filesModified: string[];
  filesDeleted: string[];
  additions: number;
  deletions: number;
  diff?: HydratedCommit | null;
}

/**
 * Analiza un commit usando Claude para determinar su tipo e impacto
 */
export async function analyzeCommit(
  params: AnalyzeCommitParams
): Promise<CommitAnalysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn(
      '⚠️  ANTHROPIC_API_KEY no configurada, usando análisis básico'
    );
    return fallbackAnalysis(params);
  }

  try {
    const model = createAnthropicModel();

    const prompt = buildAnalysisPrompt(params);

    const response = await model.invoke(prompt);
    const content = response.content.toString();

    // Parsear JSON de la respuesta
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No se encontró JSON en la respuesta');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const sanitized = sanitizeAnalysis(parsed);
    const validated = AnalysisSchema.parse(sanitized);

    console.log(
      '✅ Análisis con IA completado:',
      validated.type,
      validated.impact
    );
    return validated;
  } catch (error) {
    console.error('❌ Error en análisis con IA:', describeAnthropicError(error));
    console.log('📝 Usando análisis fallback');
    return fallbackAnalysis(params);
  }
}

/**
 * Construye el prompt para Claude
 */
function buildAnalysisPrompt(params: AnalyzeCommitParams): string {
  const totalFiles =
    params.filesAdded.length +
    params.filesModified.length +
    params.filesDeleted.length;

  const diffSection = params.diff
    ? `\n\n**DIFF REAL DEL COMMIT (lo más importante — usa esto como fuente de verdad):**\n${formatDiffForPrompt(params.diff)}\n`
    : '\n\n*(No se obtuvo el diff de este commit — analiza únicamente con los metadatos.)*\n';

  return `Eres un asistente experto en análisis de commits de Git. Analiza el siguiente commit desde DOS perspectivas: TÉCNICA y DE NEGOCIO.

**COMMIT INFO:**
- Mensaje: "${params.message}"
- Autor: ${params.author}
- Archivos agregados (${params.filesAdded.length}): ${params.filesAdded.slice(0, 10).join(', ') || 'ninguno'}
- Archivos modificados (${params.filesModified.length}): ${params.filesModified.slice(0, 10).join(', ') || 'ninguno'}
- Archivos eliminados (${params.filesDeleted.length}): ${params.filesDeleted.slice(0, 10).join(', ') || 'ninguno'}
- Total de archivos: ${totalFiles}
- Líneas agregadas: ${params.additions}
- Líneas eliminadas: ${params.deletions}${diffSection}

**TIPOS DE CAMBIO:**
- FEATURE: Nueva funcionalidad o característica
- FIX: Corrección de bugs o errores
- BREAKING: Cambio que rompe compatibilidad
- REFACTOR: Mejora de código sin cambiar funcionalidad
- DOCS: Cambios solo en documentación
- STYLE: Formato, espacios, etc (sin cambio de lógica)
- TEST: Agregar o modificar tests
- CHORE: Mantenimiento, dependencias, configs
- SKIP: Cambios irrelevantes (merges, versiones, etc)

**NIVELES DE IMPACTO:**
- HIGH: Cambios críticos, muchos archivos, funcionalidad core
- MEDIUM: Cambios moderados, features secundarias
- LOW: Cambios menores, fixes pequeños, docs

**INSTRUCCIONES:**

ANÁLISIS TÉCNICO:
1. Determina el tipo de cambio más apropiado
2. Evalúa el impacto técnico según archivos y naturaleza del cambio
3. Genera un resumen técnico claro en español (máximo 500 caracteres). Si tienes el diff, cita funciones/clases reales.
4. Lista los cambios técnicos específicos (3-8 puntos concretos, hasta 400 caracteres cada uno). Sé específico: nombres de funciones, campos, endpoints.
5. Identifica las áreas afectadas del código (1-5 áreas, hasta 150 caracteres cada una)

ANÁLISIS DE NEGOCIO:
1. businessImpact: Explica el impacto desde perspectiva de negocio (100-1500 caracteres). Usa lenguaje simple sin jerga técnica.
2. userFacingChanges: Lista los cambios visibles para el usuario final (0-10 puntos, hasta 300 caracteres cada uno). Si no hay cambios visibles, array vacío.
3. businessValue: Explica el valor que aporta este cambio al negocio/producto (100-1500 caracteres).
4. functionalDescription: Descripción funcional completa para no-técnicos (200-3000 caracteres). Explica QUÉ hace el cambio, no CÓMO está implementado. Aprovecha el diff para ser concreto.

**RESPONDE SOLO CON UN JSON** (sin markdown, sin explicaciones extra):
{
  "type": "FEATURE",
  "impact": "MEDIUM",
  "summary": "Descripción técnica del cambio",
  "technicalChanges": [
    "Cambio técnico específico 1",
    "Cambio técnico específico 2"
  ],
  "affectedAreas": [
    "Área del código 1",
    "Área del código 2"
  ],
  "reasoning": "Explicación de la clasificación",
  "businessImpact": "Impacto desde perspectiva de negocio en lenguaje simple",
  "userFacingChanges": [
    "Cambio visible 1 para el usuario",
    "Cambio visible 2 para el usuario"
  ],
  "businessValue": "Valor que aporta este cambio al negocio o producto",
  "functionalDescription": "Descripción completa de la funcionalidad para personas no técnicas. Explica qué hace el sistema ahora que no hacía antes, o qué problema resuelve para los usuarios finales."
}`;
}

/**
 * Análisis básico sin IA (fallback)
 */
function fallbackAnalysis(params: AnalyzeCommitParams): CommitAnalysis {
  const message = params.message.toLowerCase();
  const totalFiles =
    params.filesAdded.length +
    params.filesModified.length +
    params.filesDeleted.length;

  // Determinar tipo basado en mensaje
  let type: ChangeType = 'CHORE';

  if (
    message.includes('feat:') ||
    message.includes('feature:') ||
    message.includes('add:')
  ) {
    type = 'FEATURE';
  } else if (message.includes('fix:') || message.includes('bug:')) {
    type = 'FIX';
  } else if (message.includes('break:') || message.includes('breaking:')) {
    type = 'BREAKING';
  } else if (message.includes('refactor:') || message.includes('refact:')) {
    type = 'REFACTOR';
  } else if (message.includes('docs:') || message.includes('doc:')) {
    type = 'DOCS';
  } else if (message.includes('style:')) {
    type = 'STYLE';
  } else if (message.includes('test:')) {
    type = 'TEST';
  }

  // Determinar impacto
  let impact: Impact = 'LOW';
  if (totalFiles > 20 || params.additions + params.deletions > 500) {
    impact = 'HIGH';
  } else if (totalFiles > 5 || params.additions + params.deletions > 100) {
    impact = 'MEDIUM';
  }

  // Generar resumen
  const summary =
    params.message.length > 200
      ? params.message.substring(0, 197) + '...'
      : params.message;

  // Detectar áreas afectadas por extensiones de archivo
  const affectedAreas = new Set<string>();
  [
    ...params.filesAdded,
    ...params.filesModified,
    ...params.filesDeleted,
  ].forEach((file) => {
    if (file.includes('/api/')) affectedAreas.add('API');
    if (file.includes('/components/')) affectedAreas.add('Componentes UI');
    if (file.includes('/lib/')) affectedAreas.add('Lógica de negocio');
    if (file.includes('/styles/') || file.endsWith('.css'))
      affectedAreas.add('Estilos');
    if (file.includes('/types/') || file.endsWith('.ts'))
      affectedAreas.add('Types/Interfaces');
    if (file.includes('test') || file.includes('spec'))
      affectedAreas.add('Tests');
    if (file.includes('README') || file.endsWith('.md'))
      affectedAreas.add('Documentación');
  });

  const technicalChanges: string[] = [];
  if (params.filesAdded.length > 0) {
    technicalChanges.push(`${params.filesAdded.length} archivo(s) agregado(s)`);
  }
  if (params.filesModified.length > 0) {
    technicalChanges.push(
      `${params.filesModified.length} archivo(s) modificado(s)`
    );
  }
  if (params.filesDeleted.length > 0) {
    technicalChanges.push(
      `${params.filesDeleted.length} archivo(s) eliminado(s)`
    );
  }
  technicalChanges.push(`+${params.additions} / -${params.deletions} líneas`);

  // Generar información de negocio básica
  let businessImpact =
    'Cambio en la base de código que mantiene el sistema actualizado.';
  let businessValue = 'Contribuye al mantenimiento y evolución del producto.';
  const functionalDescription = params.message;
  const userFacingChanges: string[] = [];

  if (type === 'FEATURE') {
    businessImpact = 'Se agregó nueva funcionalidad al sistema.';
    businessValue =
      'Expande las capacidades del producto y mejora la propuesta de valor.';
    userFacingChanges.push('Nueva funcionalidad disponible para usuarios');
  } else if (type === 'FIX') {
    businessImpact =
      'Se corrigió un error que afectaba el funcionamiento del sistema.';
    businessValue = 'Mejora la estabilidad y confiabilidad del producto.';
    userFacingChanges.push('Corrección de error que mejora la experiencia');
  } else if (type === 'BREAKING') {
    businessImpact =
      'Cambio significativo que requiere actualización de integraciones.';
    businessValue =
      'Permite evolucionar el producto con mejoras arquitectónicas importantes.';
    userFacingChanges.push(
      'Cambio que puede requerir ajustes por parte de usuarios'
    );
  }

  return {
    type,
    impact,
    summary,
    technicalChanges,
    affectedAreas:
      affectedAreas.size > 0
        ? Array.from(affectedAreas).slice(0, 5)
        : ['Código general'],
    reasoning: 'Análisis automático basado en convenciones de commits',
    businessImpact,
    userFacingChanges,
    businessValue,
    functionalDescription,
  };
}
