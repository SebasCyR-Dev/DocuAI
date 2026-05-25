import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DocuAI Agent - Documentación técnica automatizada con IA',
  description: 'Genera y actualiza documentación técnica de software automáticamente con cada commit. Para equipos de desarrollo en Latinoamérica.',
  keywords: ['documentación', 'IA', 'desarrollo', 'software', 'automatización'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
