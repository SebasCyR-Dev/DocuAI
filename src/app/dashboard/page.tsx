import prisma from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Obtener o crear usuario en nuestra DB
  let dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    include: {
      repositories: {
        include: {
          documentations: {
            orderBy: { generatedAt: 'desc' },
            take: 10, // Aumentado porque ahora hay 2 docs por commit
          },
        },
      },
    },
  });

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        email: user.email!,
        name: user.user_metadata?.name || user.email!.split('@')[0],
        avatarUrl: user.user_metadata?.avatar_url,
      },
      include: {
        repositories: {
          include: {
            documentations: {
              orderBy: { generatedAt: 'desc' },
              take: 10,
            },
          },
        },
      },
    });
  }

  // Calcular total de commits únicos (no docs totales, ya que hay 2 por commit)
  const uniqueCommits = new Set(
    dbUser.repositories.flatMap((repo) =>
      repo.documentations.map((doc) => doc.commitSha)
    )
  );
  const totalCommitsDocumented = uniqueCommits.size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Docu<span className="text-primary">AI</span> Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              {dbUser.repositories.length > 0 && (
                <Link
                  href="/dashboard/connect"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  + Conectar Repo
                </Link>
              )}
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Cerrar Sesión
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Message */}
        <div className="mb-8">
          <h2 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
            ¡Bienvenido, {dbUser.name}!
            <svg
              className="h-8 w-8 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
              />
            </svg>
          </h2>
          <p className="mt-2 text-gray-600">
            Tu documentación técnica se genera automáticamente con IA
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="text-sm font-medium text-gray-500">
              Repositorios
            </div>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              {dbUser.repositories.length}
            </div>
            <p className="mt-1 text-sm text-gray-600">Conectados</p>
          </div>
          <div className="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="text-sm font-medium text-gray-500">
              Commits Documentados
            </div>
            <div className="mt-2 text-3xl font-bold text-primary">
              {totalCommitsDocumented}
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Con análisis dual (Business + Technical)
            </p>
          </div>
          <div className="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="text-sm font-medium text-gray-500">Plan</div>
            <div className="mt-2 text-3xl font-bold text-accent">Free</div>
            <p className="mt-1 text-sm text-gray-600">10 docs/mes</p>
          </div>
        </div>

        {/* Repositories */}
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="border-b p-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Repositorios Conectados
            </h2>
          </div>

          {dbUser.repositories.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <svg
                  className="h-8 w-8 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                No tienes repositorios conectados
              </h3>
              <p className="mb-6 text-gray-600">
                Conecta un repositorio para empezar a generar documentación
                automática
              </p>
              <Link
                href="/dashboard/connect"
                className="inline-block rounded-md bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Conectar Repositorio
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {dbUser.repositories.map((repo) => (
                <div key={repo.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {repo.fullName}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {Math.floor(repo.documentations.length / 2)} commits
                        documentados
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          repo.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {repo.isActive ? '● Activo' : '○ Inactivo'}
                      </span>
                    </div>
                  </div>

                  {/* Recent docs */}
                  {repo.documentations.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="text-sm font-medium text-gray-700">
                        Documentación Reciente:
                      </div>
                      {(() => {
                        // Agrupar por commitSha
                        const groupedByCommit = repo.documentations.reduce(
                          (acc, doc) => {
                            if (!acc[doc.commitSha]) {
                              acc[doc.commitSha] = [];
                            }
                            acc[doc.commitSha].push(doc);
                            return acc;
                          },
                          {} as Record<string, typeof repo.documentations>
                        );

                        // Tomar solo los primeros 5 commits
                        const commits = Object.entries(groupedByCommit).slice(
                          0,
                          5
                        );

                        return commits.map(([commitSha, docs]) => {
                          const mainDoc = docs[0]; // Para info general
                          const businessDoc = docs.find(
                            (d) => d.documentType === 'BUSINESS'
                          );
                          const technicalDoc = docs.find(
                            (d) => d.documentType === 'TECHNICAL'
                          );

                          return (
                            <div
                              key={commitSha}
                              className="rounded border bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                            >
                              <div className="font-medium text-gray-900">
                                {mainDoc.commitMessage}
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                                <span>{commitSha.substring(0, 7)}</span>
                                <span>•</span>
                                <span>
                                  {new Date(
                                    mainDoc.generatedAt
                                  ).toLocaleDateString('es-ES', {
                                    day: 'numeric',
                                    month: 'short',
                                  })}
                                </span>
                              </div>
                              <div className="mt-2 flex items-center gap-2">
                                {businessDoc && (
                                  <Link
                                    href={`/dashboard/docs/${businessDoc.id}`}
                                    className="rounded bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-200"
                                  >
                                    Ver Business
                                  </Link>
                                )}
                                {technicalDoc && (
                                  <Link
                                    href={`/dashboard/docs/${technicalDoc.id}`}
                                    className="rounded bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-300"
                                  >
                                    Ver Technical
                                  </Link>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-blue-900">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            Próximos Pasos
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">1.</span>
              <span>Conecta tu primer repositorio de GitHub o GitLab</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">2.</span>
              <span>
                Haz un commit y observa cómo se genera la documentación
                automáticamente
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">3.</span>
              <span>
                Exporta tus docs a PDF o HTML para entregarlas a clientes
              </span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
