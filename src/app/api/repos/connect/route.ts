import prisma from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { Octokit } from '@octokit/rest';
import { NextRequest, NextResponse } from 'next/server';

interface ConnectRepoBody {
  repoFullName: string;
  defaultBranch?: string;
  webhookUrl?: string;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ConnectRepoBody = await req.json();
    const { repoFullName, defaultBranch = 'main', webhookUrl } = body;

    if (!repoFullName) {
      return NextResponse.json(
        { error: 'Repository full name is required' },
        { status: 400 }
      );
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
          message:
            'Para conectar repositorios necesitas iniciar sesión con GitHub',
        },
        { status: 403 }
      );
    }

    // Usar el token de GitHub del usuario
    const userGithubToken = session?.provider_token;
    if (!userGithubToken) {
      return NextResponse.json(
        { error: 'GitHub token not found. Please re-login with GitHub.' },
        { status: 401 }
      );
    }

    // Token del .env solo para crear webhooks
    const webhookToken = process.env.GITHUB_TOKEN || userGithubToken;

    // Obtener info del repo desde GitHub para el externalId
    const octokit = new Octokit({ auth: userGithubToken });
    const [owner, repoName] = repoFullName.split('/');

    let repoInfo;
    try {
      const { data } = await octokit.repos.get({
        owner,
        repo: repoName,
      });
      repoInfo = data;
    } catch (error) {
      return NextResponse.json(
        { error: 'Repository not found on GitHub' },
        { status: 404 }
      );
    }

    // Verificar que el usuario existe en nuestra DB
    let dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    });

    if (!dbUser) {
      // Crear usuario si no existe
      dbUser = await prisma.user.create({
        data: {
          email: user.email!,
          name: user.user_metadata?.name || user.email!.split('@')[0],
          avatarUrl: user.user_metadata?.avatar_url,
        },
      });
    }

    // Verificar si el repo ya está registrado
    const existingRepo = await prisma.repository.findFirst({
      where: {
        fullName: repoFullName,
        userId: dbUser.id,
      },
    });

    if (existingRepo) {
      return NextResponse.json(
        { error: 'Repository already connected', repo: existingRepo },
        { status: 400 }
      );
    }

    // Registrar repositorio en DB
    const webhookSecret =
      process.env.GITHUB_WEBHOOK_SECRET || 'desarrollo-docuai-2026';

    const newRepo = await prisma.repository.create({
      data: {
        fullName: repoFullName,
        name: repoInfo.name,
        externalId: String(repoInfo.id),
        provider: 'GITHUB',
        defaultBranch: repoInfo.default_branch || defaultBranch,
        webhookSecret,
        isActive: true,
        userId: dbUser.id,
      },
    });

    console.log('✅ Repository registered:', newRepo.fullName);

    // Intentar crear webhook si se proporciona URL
    let webhookCreated = false;
    let webhookId: number | null = null;
    let webhookError: string | null = null;

    if (webhookUrl) {
      try {
        const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

        // Intentar usar token del .env para webhooks, sino el del usuario
        const webhookOctokit = webhookToken
          ? new Octokit({ auth: webhookToken })
          : octokit;

        if (webhookSecret) {
          const { data: webhook } = await webhookOctokit.repos.createWebhook({
            owner,
            repo: repoName,
            config: {
              url: webhookUrl,
              content_type: 'json',
              secret: webhookSecret,
              insecure_ssl: '0',
            },
            events: ['push'],
            active: true,
          });

          webhookCreated = true;
          webhookId = webhook.id;

          // Actualizar repo con webhookId
          await prisma.repository.update({
            where: { id: newRepo.id },
            data: { webhookId: String(webhook.id) },
          });

          console.log('✅ Webhook created:', webhook.id);
        }
      } catch (error: unknown) {
        console.warn(
          '⚠️  Failed to create webhook:',
          error instanceof Error ? error.message : 'Unknown error'
        );
        webhookError = error instanceof Error ? error.message : 'Unknown error';
        // No fallar la petición, solo registrar el error
      }
    }

    return NextResponse.json({
      success: true,
      repo: newRepo,
      webhook: {
        created: webhookCreated,
        id: webhookId,
        error: webhookError,
      },
    });
  } catch (error: unknown) {
    console.error(
      '❌ Error connecting repository:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to connect repository',
      },
      { status: 500 }
    );
  }
}
