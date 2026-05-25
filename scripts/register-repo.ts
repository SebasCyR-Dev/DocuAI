import prisma from '@/lib/db';

/**
 * Script para registrar manualmente un repositorio para pruebas
 * Ejecuta: pnpm tsx scripts/register-repo.ts
 */

async function main() {
  const userEmail = 'sebastian.castedoribera.03@gmail.com';
  const repoFullName = 'SebasCyR-Dev/Restaurante-Frontend';

  console.log('🔍 Buscando usuario...');
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    console.error('❌ Usuario no encontrado');
    process.exit(1);
  }

  console.log('✅ Usuario encontrado:', user.name);
  console.log('📦 Registrando repositorio:', repoFullName);

  // Detectar si ya existe
  const existingRepo = await prisma.repository.findFirst({
    where: {
      userId: user.id,
      fullName: repoFullName,
    },
  });

  if (existingRepo) {
    console.log('⚠️  Repositorio ya registrado:', existingRepo.id);
    console.log('✅ Puedes ver el repo en tu dashboard!');
    return;
  }

  const repo = await prisma.repository.create({
    data: {
      userId: user.id,
      provider: 'GITHUB',
      externalId: '123456789', // ID ficticio para pruebas
      name: 'Restaurante-Frontend',
      fullName: repoFullName,
      webhookSecret: 'desarrollo-docuai-2026',
      defaultBranch: 'main', // Solo se procesarán commits a esta rama
      isActive: true,
    },
  });

  console.log('✅ Repositorio registrado:', repo.id);
  console.log('🌿 Rama configurada:', repo.defaultBranch);
  console.log('🎉 Ahora verás el repo en tu dashboard!');
  console.log('');
  console.log(
    '💡 Nota: Solo se procesarán commits a la rama:',
    repo.defaultBranch
  );
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
