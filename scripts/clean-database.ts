/**
 * Script para limpiar TODA la base de datos
 * ⚠️ CUIDADO: Esto borrará TODO - usuarios, repos, documentación
 * Solo para desarrollo/testing
 */

import prisma from '../src/lib/db';

async function cleanDatabase() {
  console.log('🧹 Iniciando limpieza de base de datos...\n');

  try {
    // 1. Limpiar documentaciones (tiene FK a repositories)
    console.log('📄 Eliminando documentaciones...');
    const deletedDocs = await prisma.documentation.deleteMany({});
    console.log(`   ✅ ${deletedDocs.count} documentaciones eliminadas\n`);

    // 2. Limpiar repositorios (tiene FK a users)
    console.log('📦 Eliminando repositorios...');
    const deletedRepos = await prisma.repository.deleteMany({});
    console.log(`   ✅ ${deletedRepos.count} repositorios eliminados\n`);

    // 3. Limpiar subscriptions (tiene FK a users)
    console.log('💳 Eliminando subscripciones...');
    const deletedSubs = await prisma.subscription.deleteMany({});
    console.log(`   ✅ ${deletedSubs.count} subscripciones eliminadas\n`);

    // 4. Limpiar usuarios
    console.log('👤 Eliminando usuarios...');
    const deletedUsers = await prisma.user.deleteMany({});
    console.log(`   ✅ ${deletedUsers.count} usuarios eliminados\n`);

    console.log('✅ Base de datos limpiada exitosamente!\n');
    console.log(
      '⚠️  NOTA: Los usuarios de Supabase Auth NO se eliminan automáticamente.'
    );
    console.log('   Para limpiar usuarios OAuth de Supabase:');
    console.log('   1. Ve a Supabase Dashboard → Authentication → Users');
    console.log('   2. Elimina manualmente los usuarios\n');
    console.log('   O ejecuta este SQL en el SQL Editor de Supabase:');
    console.log("   DELETE FROM auth.users WHERE email LIKE '%@%';");
    console.log('');
  } catch (error) {
    console.error('❌ Error limpiando base de datos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
cleanDatabase()
  .then(() => {
    console.log('🎉 Proceso completado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
