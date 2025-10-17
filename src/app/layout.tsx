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
      </body>
    </html>
  );
}
