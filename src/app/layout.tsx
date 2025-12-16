import './global.css';

import ClientProviders from '@/components/client-providers';

export const metadata = {
  title: 'GIS Docusign App',
  description: 'Document management with GIS Docusign API and Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ClientProviders>
          <div className="relative flex min-h-screen flex-col">
            <main className="flex-1">
              {children}
            </main>
          </div>
        </ClientProviders>
        <svg className="hidden-svg">
          <defs>
            <clipPath id="folder-clip" clipPathUnits="objectBoundingBox">
              <path d="M0,0.1 C0,0.04 0.04,0 0.1,0 L0.35,0 C0.38,0 0.4,0.03 0.4,0.06 L0.9,0.06 C0.96,0.06 1,0.1 1,0.15 L1,0.85 C1,0.9 0.95,0.95 0.9,0.95 L0.65,0.95 C0.6,0.95 0.58,1 0.5,1 C0.42,1 0.4,0.95 0.35,0.95 L0.1,0.95 C0.04,0.95 0,0.9 0,0.85 L0,0.1 Z" />
            </clipPath>
          </defs>
        </svg>
      </body>
    </html>
  );
}
