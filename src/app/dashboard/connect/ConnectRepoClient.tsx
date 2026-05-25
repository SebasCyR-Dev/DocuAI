'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  defaultBranch: string;
  language: string | null;
  stargazersCount: number;
  updatedAt: string;
  htmlUrl: string;
  isConnected: boolean;
}

interface Props {
  userEmail: string;
}

export default function ConnectRepoClient({ userEmail }: Props) {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [needsGitHub, setNeedsGitHub] = useState(false);

  useEffect(() => {
    fetchRepos();
    // Pre-llenar webhook URL si está en desarrollo
    if (window.location.hostname === 'localhost') {
      setWebhookUrl('https://tu-ngrok-url.ngrok.io/api/webhooks/github');
    }
  }, []);

  async function fetchRepos() {
    try {
      setLoading(true);
      const res = await fetch('/api/github/repos');
      const data = await res.json();

      if (!res.ok) {
        // Manejar caso especial: necesita GitHub login
        if (data.needsGitHub) {
          setNeedsGitHub(true);
          setError(data.message || 'Necesitas iniciar sesión con GitHub');
          return;
        }

        throw new Error(data.error || 'Failed to fetch repositories');
      }

      setRepos(data.repos);
      setNeedsGitHub(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  async function connectRepo(repo: GitHubRepo) {
    if (repo.isConnected) {
      alert('Este repositorio ya está conectado');
      return;
    }

    if (!confirm(`¿Conectar ${repo.fullName}?`)) return;

    try {
      setConnecting(repo.fullName);
      const res = await fetch('/api/repos/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoFullName: repo.fullName,
          defaultBranch: repo.defaultBranch,
          webhookUrl: webhookUrl || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to connect repository');
      }

      alert(
        `✅ Repositorio conectado: ${repo.fullName}\n\n${
          data.webhook.created
            ? `✅ Webhook creado (ID: ${data.webhook.id})`
            : data.webhook.error
              ? `⚠️  Webhook no creado: ${data.webhook.error}\nPuedes configurarlo manualmente en GitHub.`
              : '⚠️  Webhook no configurado (proporciona URL arriba)'
        }`
      );

      // Redirigir al dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      alert(
        `❌ Error: ${err instanceof Error ? err.message : 'Error desconocido'}`
      );
    } finally {
      setConnecting(null);
    }
  }

  const filteredRepos = repos.filter(
    (repo) =>
      repo.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                ← Volver
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                Conectar Repositorio
              </h1>
            </div>
            <span className="text-sm text-gray-600">{userEmail}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Webhook URL Config */}
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <h3 className="mb-2 font-medium text-yellow-900">
            🔗 Configuración Webhook (Opcional)
          </h3>
          <p className="mb-3 text-sm text-yellow-800">
            Si proporcionas la URL del webhook, se configurará automáticamente
            en GitHub. Si no, deberás configurarlo manualmente después.
          </p>
          <input
            type="text"
            placeholder="https://tu-ngrok-url.ngrok.io/api/webhooks/github"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-2 text-xs text-yellow-700">
            💡 En desarrollo usa tu URL de ngrok. En producción usa tu dominio
            (ej: https://docuai.com/api/webhooks/github)
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="search"
            placeholder="🔍 Buscar repositorios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-lg border bg-white p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary"></div>
            <p className="mt-4 text-gray-600">Cargando repositorios...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className={`rounded-lg border p-6 text-center ${
              needsGitHub
                ? 'border-yellow-200 bg-yellow-50'
                : 'border-red-200 bg-red-50'
            }`}
          >
            <p
              className={`mb-4 ${needsGitHub ? 'text-yellow-800' : 'text-red-800'}`}
            >
              {needsGitHub ? '⚠️' : '❌'} {error}
            </p>

            {needsGitHub ? (
              <div className="space-y-3">
                <p className="text-sm text-yellow-700">
                  Actualmente iniciaste sesión con Google. Para conectar
                  repositorios y generar documentación automática, necesitas
                  vincular tu cuenta de GitHub.
                </p>
                <button
                  onClick={() => {
                    // Redirigir a login de GitHub
                    window.location.href = '/login?connect=github';
                  }}
                  className="rounded-md bg-gray-900 px-6 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  🔗 Vincular cuenta de GitHub
                </button>
                <p className="text-xs text-yellow-600">
                  Esto no afectará tu cuenta de Google
                </p>
              </div>
            ) : (
              <button
                onClick={fetchRepos}
                className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
              >
                Reintentar
              </button>
            )}
          </div>
        )}

        {/* Repos List */}
        {!loading && !error && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {filteredRepos.length} repositorio(s) encontrado(s)
            </p>

            {filteredRepos.length === 0 && (
              <div className="rounded-lg border bg-white p-8 text-center">
                <p className="text-gray-600">
                  No se encontraron repositorios con &quot;{searchQuery}&quot;
                </p>
              </div>
            )}

            {filteredRepos.map((repo) => (
              <div
                key={repo.id}
                className="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {repo.fullName}
                      </h3>
                      {repo.private && (
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                          🔒 Privado
                        </span>
                      )}
                      {repo.isConnected && (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                          ✓ Conectado
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-gray-600">
                      {repo.description || 'Sin descripción'}
                    </p>

                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          <span className="h-3 w-3 rounded-full bg-blue-500"></span>
                          {repo.language}
                        </span>
                      )}
                      <span>⭐ {repo.stargazersCount}</span>
                      <span>
                        Branch:{' '}
                        <code className="text-xs">{repo.defaultBranch}</code>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => connectRepo(repo)}
                    disabled={connecting === repo.fullName || repo.isConnected}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {connecting === repo.fullName ? (
                      <span className="flex items-center gap-2">
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                        Conectando...
                      </span>
                    ) : repo.isConnected ? (
                      'Conectado'
                    ) : (
                      'Conectar'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
