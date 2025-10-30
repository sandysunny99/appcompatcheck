import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { hasPermission, Permission } from '@/lib/auth/permissions';
import { ScanResultsView } from '@/components/reports/ScanResultsView';
import { Loader2 } from 'lucide-react';

export default async function ScanResultsPage({
  searchParams,
}: {
  searchParams: { session?: string; id?: string };
}) {
  const userSession = await getSession();
  
  if (!userSession?.user) {
    redirect('/sign-in');
  }

  if (!hasPermission(userSession, Permission.REPORT_READ)) {
    redirect('/dashboard');
  }

  const scanSessionId = searchParams.session;
  const scanId = searchParams.id;

  if (!scanSessionId && !scanId) {
    redirect('/reports');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }>
        <ScanResultsView 
          scanSessionId={scanSessionId} 
          scanId={scanId}
          userId={userSession.user.id}
        />
      </Suspense>
    </div>
  );
}
