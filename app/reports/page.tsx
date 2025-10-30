import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { hasPermission, Permission } from '@/lib/auth/permissions';
import { ReportsDashboard } from '@/components/reports/ReportsDashboard';
import { Loader2 } from 'lucide-react';

export default async function ReportsPage() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/sign-in');
  }

  if (!hasPermission(session, Permission.REPORT_READ)) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reports Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Generate and manage compatibility analysis reports.
        </p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }>
        <ReportsDashboard 
          userId={session.user.id} 
          organizationId={session.user.organizationId}
        />
      </Suspense>
    </div>
  );
}