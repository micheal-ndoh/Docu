'use client';

import { useSession } from '@/lib/auth-client';
import { DashboardSkeleton } from '@/components/loading-skeletons';
import { LandingPage } from '@/components/landing/main-page';

export default function HomePage() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <DashboardSkeleton />;
  }

  // Always show landing page, even for authenticated users
  return <LandingPage />;
}
