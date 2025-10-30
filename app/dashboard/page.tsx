import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { EnhancedDashboard } from '@/components/dashboard/EnhancedDashboard';
import { Loader2 } from 'lucide-react';

export default async function DashboardPage() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/sign-in');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }>
        <EnhancedDashboard 
          userId={session.user.id}
          userEmail={session.user.email}
          organizationId={session.user.organizationId}
        />
      </Suspense>
    </div>
  );
}
