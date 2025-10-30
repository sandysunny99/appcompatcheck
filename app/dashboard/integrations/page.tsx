import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { hasPermission, Permission } from '@/lib/auth/permissions';
import { IntegrationsManager } from '@/components/integrations/IntegrationsManager';
import { Loader2 } from 'lucide-react';

export default async function IntegrationsPage() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/sign-in');
  }

  if (!hasPermission(session, Permission.SYSTEM_SETTINGS)) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-600 mt-2">
          Connect and manage third-party integrations for your organization.
        </p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }>
        <IntegrationsManager userId={session.user.id} />
      </Suspense>
    </div>
  );
}
