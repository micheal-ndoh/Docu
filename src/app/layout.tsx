import './global.css';
import ClientProviders from '@/components/client-providers';

export const metadata = {
  title: 'DocuSeal App',
  description: 'Document management with DocuSeal API and Next.js',
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
              <path d="M0,0.1 C0,0.05 0.05,0 0.1,0 L0.35,0 C0.375,0 0.4,0.05 0.4,0.1 L0.4,0.1 L0.9,0.1 C0.95,0.1 1,0.15 1,0.2 L1,0.9 C1,0.95 0.95,1 0.9,1 L0.1,1 C0.05,1 0,0.95 0,0.9 L0,0.1 Z" />
            </clipPath>
          </defs>
        </svg>
      </body>
    </html>
  );
}
