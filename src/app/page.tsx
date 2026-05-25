import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Docu<span className="text-primary">AI</span>
            </h1>
            <Link
              href="/login"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mb-6 inline-block rounded-full bg-accent/10 px-4 py-1">
            <span className="flex items-center gap-2 text-sm font-semibold text-accent">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              Powered by Claude AI
            </span>
          </div>

          <h1 className="mb-6 text-6xl font-bold text-gray-900">
            Documentación técnica <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              automática con IA
            </span>
          </h1>

          <p className="mx-auto mb-4 max-w-2xl text-xl text-gray-600">
            Genera y actualiza documentación técnica de software automáticamente
            con cada commit. Integración nativa con GitHub y GitLab.
          </p>

          <p className="mx-auto mb-12 max-w-2xl text-lg text-gray-500">
            <strong className="text-gray-900">
              Para freelancers, startups y empresas en LATAM.
            </strong>
            <br />
            Entrega PDFs profesionales a tus clientes sin esfuerzo manual.
          </p>

          {/* CTAs */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/login"
              className="rounded-md bg-primary px-8 py-3 text-lg font-medium text-white shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Empezar Gratis
            </Link>
            <Link
              href="#features"
              className="rounded-md border border-gray-300 bg-white px-8 py-3 text-lg font-medium text-gray-900 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Ver Demo
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div
          id="features"
          className="mt-24 grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          <div className="rounded-lg border bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <svg
                className="h-7 w-7 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">
              100% Automático
            </h3>
            <p className="text-gray-600">
              Documentación generada en cada commit. Sin intervención manual,
              sin olvidar actualizar.
            </p>
          </div>

          <div className="rounded-lg border bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <svg
                className="h-7 w-7 text-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">
              IA Avanzada
            </h3>
            <p className="text-gray-600">
              Claude Sonnet 4.5 analiza tu código y genera docs contextuales, no
              genéricas.
            </p>
          </div>

          <div className="rounded-lg border bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
              <svg
                className="h-7 w-7 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">
              Zero Data Retention
            </h3>
            <p className="text-gray-600">
              Tu código nunca se almacena. Procesamiento en memoria y descarte
              inmediato.
            </p>
          </div>

          <div className="rounded-lg border bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
              <svg
                className="h-7 w-7 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">
              Multi-formato
            </h3>
            <p className="text-gray-600">
              Exporta a Markdown, HTML y PDF profesional. Listo para entregar a
              clientes.
            </p>
          </div>

          <div className="rounded-lg border bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
              <svg
                className="h-7 w-7 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">
              Ultra Rápido
            </h3>
            <p className="text-gray-600">
              Documentación lista en {'<'}30 segundos. Latencia optimizada para
              desarrolladores.
            </p>
          </div>

          <div className="rounded-lg border bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10">
              <svg
                className="h-7 w-7 text-orange-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">
              LATAM First
            </h3>
            <p className="text-gray-600">
              Precios accesibles para el mercado latinoamericano. Desde $9/mes.
            </p>
          </div>
        </div>

        {/* Social Proof */}
        <div className="mt-24 rounded-lg border border-blue-200 bg-blue-50 p-8 text-center">
          <div className="mb-4 flex items-center justify-center">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p className="ml-2 text-sm font-semibold text-blue-900">
              Validado con investigación real
            </p>
          </div>
          <p className="text-gray-700">
            <strong>49 encuestas</strong> a desarrolladores en LATAM •{' '}
            <strong>82.4%</strong> pagaría por esta solución •{' '}
            <strong>56.3%</strong> no conoce herramientas similares
          </p>
        </div>

        {/* Footer */}
        <div className="mt-24 text-center">
          <p className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <svg
              className="h-4 w-4"
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
            Etapa 1/9 completada - MVP en desarrollo
          </p>
          <p className="mt-2 text-xs text-gray-400">
            Universidad NUR • Comercio Electrónico • 2026-1
          </p>
        </div>
      </div>
    </main>
  );
}
