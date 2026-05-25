import { analyzeCommit } from '@/lib/ai/analyzer';
import { generateBusinessDocumentation } from '@/lib/ai/generator-business';
import { generateTechnicalDocumentation } from '@/lib/ai/generator-technical';
import prisma from '@/lib/db';
import { hydrateCommitDiff } from '@/lib/github/fetch-commit';
import { saveDocumentation } from '@/services/documentation/save';
import crypto from 'crypto';
import { type NextRequest, NextResponse } from 'next/server';

// Verificar firma del webhook de GitHub
function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return false;

  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'GitHub webhook endpoint ready',
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-hub-signature-256');

    // Verificar firma (en producción es obligatorio)
    if (signature && !verifySignature(body, signature)) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body);
    const event = req.headers.get('x-github-event');

    console.log('🎉 Webhook recibido:', event);
    console.log('📦 Repo:', payload.repository?.full_name);

    // Solo procesamos push events
    if (event === 'push') {
      // 🔒 GITFLOW: Solo procesar push a main/master
      const ref = payload.ref; // "refs/heads/main" o "refs/heads/develop"
      const branch = ref?.replace('refs/heads/', '');
      const repoFullName = payload.repository?.full_name;

      console.log('🌿 Rama:', branch);

      // Buscar repo en DB para obtener configuración
      const dbRepo = await prisma.repository.findFirst({
        where: {
          fullName: repoFullName,
          provider: 'GITHUB',
        },
      });

      // Determinar ramas permitidas
      let allowedBranches = ['main', 'master'];

      if (dbRepo) {
        console.log('📂 Repo encontrado en DB:', dbRepo.name);
        console.log('⚙️  Rama configurada:', dbRepo.defaultBranch);
        allowedBranches = [dbRepo.defaultBranch];
      } else {
        console.log('⚠️  Repo no registrado en DB, usando ramas por defecto');
      }

      // Solo procesar ramas permitidas
      if (!branch || !allowedBranches.includes(branch)) {
        console.log(
          `⏭️  Ignorando push a rama "${branch}" (solo procesamos: ${allowedBranches.join(', ')})`
        );
        return NextResponse.json({
          received: true,
          skipped: true,
          reason: `Branch "${branch}" not in allowed list`,
          allowedBranches,
        });
      }

      console.log('✅ Rama permitida, procesando...');

      const commit = payload.head_commit;

      if (!commit) {
        return NextResponse.json({ error: 'No commit data' }, { status: 400 });
      }

      console.log('📝 Commit:', commit.id.substring(0, 7));
      console.log('👤 Autor:', commit.author.name);
      console.log('💬 Mensaje:', commit.message);

      const filesAdded = commit.added || [];
      const filesModified = commit.modified || [];
      const filesDeleted = commit.removed || [];
      const totalFiles =
        filesAdded.length + filesModified.length + filesDeleted.length;

      console.log('📄 Archivos modificados:', totalFiles);

      // 🔍 HIDRATAR DIFF DESDE GITHUB API
      // El webhook solo trae rutas de archivo; pedimos el patch real para que la IA
      // documente el código de verdad y no adivine por nombres de archivo.
      console.log('🔍 Hidratando diff desde GitHub...');
      const [owner, repoName] = repoFullName.split('/');
      const hydratedDiff = await hydrateCommitDiff({
        owner,
        repo: repoName,
        sha: commit.id,
      });
      if (hydratedDiff) {
        console.log(
          `📦 Diff hidratado: ${hydratedDiff.filesWithDiff.length} archivos con patch · +${hydratedDiff.totalAdditions}/-${hydratedDiff.totalDeletions} líneas${hydratedDiff.filesOmittedCount > 0 ? ` · ${hydratedDiff.filesOmittedCount} omitidos` : ''}`
        );
      }

      // ✨ ANÁLISIS CON IA (Etapa 3)
      console.log('🤖 Analizando commit con IA...');

      const analysis = await analyzeCommit({
        message: commit.message,
        author: commit.author.name,
        filesAdded,
        filesModified,
        filesDeleted,
        additions: hydratedDiff?.totalAdditions ?? 0,
        deletions: hydratedDiff?.totalDeletions ?? 0,
        diff: hydratedDiff,
      });

      console.log('📊 Tipo:', analysis.type);
      console.log('🎯 Impacto:', analysis.impact);
      console.log('📝 Resumen:', analysis.summary);
      console.log('🔧 Cambios técnicos:', analysis.technicalChanges);
      console.log('📂 Áreas afectadas:', analysis.affectedAreas);
      console.log('✅ Análisis completado');

      // 📄 GENERACIÓN Y GUARDADO (Etapa 4)
      if (dbRepo) {
        console.log('💾 Generando documentación (2 versiones)...');

        const allFiles = [...filesAdded, ...filesModified, ...filesDeleted];

        // Generar documentación de NEGOCIO
        console.log('📊 Generando versión de negocio...');
        const businessDoc = await generateBusinessDocumentation({
          analysis,
          commitSha: commit.id,
          commitMessage: commit.message,
          commitAuthor: commit.author.name,
          commitDate: commit.timestamp,
          repositoryName: dbRepo.fullName,
          filesModified: allFiles,
        });

        // Generar documentación TÉCNICA
        console.log('🔧 Generando versión técnica...');
        const technicalDoc = await generateTechnicalDocumentation({
          analysis,
          commitSha: commit.id,
          commitMessage: commit.message,
          commitAuthor: commit.author.name,
          commitDate: commit.timestamp,
          repositoryName: dbRepo.fullName,
          filesModified: allFiles,
          filesAdded,
          filesDeleted,
          additions: hydratedDiff?.totalAdditions ?? 0,
          deletions: hydratedDiff?.totalDeletions ?? 0,
        });

        console.log(
          '📄 Docs generadas: Business (',
          businessDoc.length,
          'chars), Technical (',
          technicalDoc.length,
          'chars)'
        );
        console.log('💾 Guardando ambas versiones en base de datos...');

        // Guardar documento de NEGOCIO
        const savedBusiness = await saveDocumentation({
          repositoryId: dbRepo.id,
          commitSha: commit.id,
          commitMessage: commit.message,
          commitAuthor: commit.author.name,
          type: analysis.type,
          impact: analysis.impact,
          documentType: 'BUSINESS',
          content: businessDoc,
          format: 'MARKDOWN',
          metadata: {
            branch,
            filesCount: allFiles.length,
            businessImpact: analysis.businessImpact,
            businessValue: analysis.businessValue,
            userFacingChanges: analysis.userFacingChanges,
          },
        });

        // Guardar documento TÉCNICO
        const savedTechnical = await saveDocumentation({
          repositoryId: dbRepo.id,
          commitSha: commit.id,
          commitMessage: commit.message,
          commitAuthor: commit.author.name,
          type: analysis.type,
          impact: analysis.impact,
          documentType: 'TECHNICAL',
          content: technicalDoc,
          format: 'MARKDOWN',
          metadata: {
            branch,
            filesCount: allFiles.length,
            technicalChanges: analysis.technicalChanges,
            affectedAreas: analysis.affectedAreas,
          },
        });

        console.log(
          '✅ Documentación guardada:',
          'Business:',
          savedBusiness.id.substring(0, 8) + '...',
          'Technical:',
          savedTechnical.id.substring(0, 8) + '...'
        );
        console.log('🎉 Pipeline completo ejecutado exitosamente!');

        return NextResponse.json({
          received: true,
          processed: true,
          documentationIds: {
            business: savedBusiness.id,
            technical: savedTechnical.id,
          },
          repository: repoFullName,
          commit: commit.id.substring(0, 7),
          type: analysis.type,
          impact: analysis.impact,
        });
      } else {
        console.log('⚠️  Repo no registrado, no se guardará la documentación');
        console.log('💡 Ejecuta: pnpm register-repo');

        return NextResponse.json({
          received: true,
          skipped: true,
          reason: 'Repository not registered in database',
          repositoryName: repoFullName,
        });
      }
    }

    return NextResponse.json({
      received: true,
      event,
      repository: payload.repository?.full_name,
    });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
