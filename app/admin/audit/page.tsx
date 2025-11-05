import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { hasPermission, Permission } from '@/lib/auth/permissions';
import AuditDashboard from '@/components/monitoring/audit-dashboard';
import { Loader2 } from 'lucide-react';

export default async function AuditPage() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/sign-in');
  }

  // Check if user has admin system permission
  if (!hasPermission(session, Permission.ADMIN_SYSTEM)) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-600 mt-2">
          Review system audit logs, compliance reports, and security events.
        </p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }>
        <AuditDashboard />
      </Suspense>
    </div>
  );
}