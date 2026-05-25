import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-violet-50 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-3xl font-bold text-gray-900">
          Documentación No Encontrada
        </h2>
        <p className="mt-2 text-gray-600">
          La documentación que buscas no existe o ha sido eliminada.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-md bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        >
          Volver al Dashboard
        </Link>
      </div>
    </div>
  );
}
