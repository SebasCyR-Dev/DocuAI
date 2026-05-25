import prisma from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { Octokit } from '@octokit/rest';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obtener session para acceder al provider_token
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Verificar que hizo login con GitHub
    const provider = session?.user.app_metadata?.provider;
    if (provider !== 'github') {
      return NextResponse.json(
        {
          error: 'GitHub login required',
          needsGitHub: true,
          currentProvider: provider,
          message:
            'Para conectar repositorios necesitas iniciar sesión con GitHub',
        },
        { status: 403 }
      );
    }

    // Usar el token de GitHub del usuario (NO el de .env)
    const userGithubToken = session?.provider_token;
    if (!userGithubToken) {
      return NextResponse.json(
        {
          error: 'GitHub token not found',
          needsReauth: true,
          message:
            'Tu sesión de GitHub expiró. Por favor inicia sesión nuevamente.',
        },
        { status: 401 }
      );
    }

    // Obtener repos ya conectados de la DB
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      include: { repositories: true },
    });

    const connectedRepoNames = new Set(
      dbUser?.repositories.map((r) => r.fullName) || []
    );

    // Usar el token del usuario, no el del .env
    const octokit = new Octokit({ auth: userGithubToken });

    // Obtener repos del usuario autenticado
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
      affiliation: 'owner,collaborator',
    });

    // Filtrar solo repos no archivados y formatear
    const formattedRepos = repos
      .filter((repo) => !repo.archived)
      .map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        private: repo.private,
        defaultBranch: repo.default_branch,
        language: repo.language,
        stargazersCount: repo.stargazers_count,
        updatedAt: repo.updated_at,
        htmlUrl: repo.html_url,
        isConnected: connectedRepoNames.has(repo.full_name),
      }));

    return NextResponse.json({
      repos: formattedRepos,
      total: formattedRepos.length,
      connected: connectedRepoNames.size,
    });
  } catch (error: any) {
    console.error('❌ Error fetching GitHub repos:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch repositories' },
      { status: 500 }
    );
  }
}
