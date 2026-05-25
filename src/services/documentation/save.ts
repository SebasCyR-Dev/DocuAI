import prisma from '@/lib/db';
import { ChangeType, DocumentType, Format, Impact } from '@prisma/client';

interface SaveDocumentationOptions {
  repositoryId: string;
  commitSha: string;
  commitMessage: string;
  commitAuthor: string;
  type: ChangeType;
  impact: Impact;
  documentType: DocumentType;
  content: string;
  format?: Format;
  metadata?: Record<string, any>;
}

/**
 * Guarda la documentación generada en la base de datos
 */
export async function saveDocumentation(
  options: SaveDocumentationOptions
): Promise<{ id: string; success: boolean }> {
  try {
    const {
      repositoryId,
      commitSha,
      commitMessage,
      commitAuthor,
      type,
      impact,
      documentType,
      content,
      format = 'MARKDOWN',
      metadata = {},
    } = options;

    // Verificar si ya existe documentación para este commit y tipo
    const existing = await prisma.documentation.findFirst({
      where: {
        repositoryId,
        commitSha,
        documentType,
      },
    });

    if (existing) {
      console.log(
        `⚠️  Ya existe documentación ${documentType} para commit ${commitSha.substring(0, 7)}, actualizando...`
      );

      const updated = await prisma.documentation.update({
        where: { id: existing.id },
        data: {
          commitMessage,
          commitAuthor,
          type,
          impact,
          content,
          format,
          metadata,
        },
      });

      return { id: updated.id, success: true };
    }

    // Crear nueva documentación
    const doc = await prisma.documentation.create({
      data: {
        repositoryId,
        commitSha,
        commitMessage,
        commitAuthor,
        type,
        impact,
        documentType,
        content,
        format,
        metadata,
      },
    });

    console.log(
      `✅ Documentación ${documentType} guardada: ${doc.id.substring(0, 8)}...`
    );
    return { id: doc.id, success: true };
  } catch (error) {
    console.error('❌ Error guardando documentación:', error);
    throw error;
  }
}

/**
 * Obtiene documentación por ID
 */
export async function getDocumentation(id: string) {
  return await prisma.documentation.findUnique({
    where: { id },
    include: {
      repository: {
        select: {
          name: true,
          fullName: true,
          provider: true,
        },
      },
    },
  });
}

/**
 * Obtiene documentación de un repositorio
 */
export async function getRepositoryDocumentation(
  repositoryId: string,
  options: {
    limit?: number;
    offset?: number;
    type?: ChangeType;
  } = {}
) {
  const { limit = 50, offset = 0, type } = options;

  return await prisma.documentation.findMany({
    where: {
      repositoryId,
      ...(type && { type }),
    },
    orderBy: {
      generatedAt: 'desc',
    },
    take: limit,
    skip: offset,
    include: {
      repository: {
        select: {
          name: true,
          fullName: true,
        },
      },
    },
  });
}

/**
 * Cuenta documentación por tipo
 */
export async function getDocumentationStats(repositoryId: string) {
  const total = await prisma.documentation.count({
    where: { repositoryId },
  });

  const byType = await prisma.documentation.groupBy({
    by: ['type'],
    where: { repositoryId },
    _count: { type: true },
  });

  const byImpact = await prisma.documentation.groupBy({
    by: ['impact'],
    where: { repositoryId },
    _count: { impact: true },
  });

  return {
    total,
    byType: byType.reduce(
      (acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      },
      {} as Record<string, number>
    ),
    byImpact: byImpact.reduce(
      (acc, item) => {
        acc[item.impact] = item._count.impact;
        return acc;
      },
      {} as Record<string, number>
    ),
  };
}

/**
 * Elimina documentación antigua (limpieza)
 */
export async function cleanupOldDocumentation(
  repositoryId: string,
  daysToKeep: number = 90
) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await prisma.documentation.deleteMany({
    where: {
      repositoryId,
      generatedAt: {
        lt: cutoffDate,
      },
    },
  });

  console.log(`🧹 Eliminadas ${result.count} documentaciones antiguas`);
  return result.count;
}
