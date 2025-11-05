import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { hasPermission, Permission } from '@/lib/auth/permissions';
import { EnhancedReportsDashboard } from '@/components/reports/EnhancedReportsDashboard';
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
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-blue-500 rounded"></div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Advanced filtering, visualization, and analytics for your compatibility reports.
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-sm">Loading reports...</p>
          </div>
        </div>
      }>
        <EnhancedReportsDashboard
          userId={session.user.id} 
          organizationId={session.user.organizationId}
        />
      </Suspense>
    </div>
  );
}